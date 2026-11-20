package com.quickstay.partner;

import com.quickstay.booking.Booking;
import com.quickstay.booking.BookingRepository;
import com.quickstay.config.ApiException;
import com.quickstay.hotel.Room;
import com.quickstay.hotel.RoomClosure;
import com.quickstay.hotel.RoomClosureRepository;
import com.quickstay.hotel.RoomRepository;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Lich phong cua doi tac khach san: so phong da dat / dang dong / con trong theo tung ngay,
 * va dong phong (bao tri, ban qua kenh khac) de khach khong dat duoc nhung ngay do.
 */
@Service
public class PartnerInventoryService {

    static final int MAX_CALENDAR_DAYS = 62;
    static final int MAX_DAYS_AHEAD = 365;

    public record DayCell(LocalDate date, int booked, int closed, int available) {}

    public record RoomCalendar(Long roomId, String roomType, int quantity, List<DayCell> days) {}

    public record CalendarView(LocalDate from, LocalDate to, List<RoomCalendar> rooms) {}

    public record ClosureRequest(
            @NotNull(message = "Chua chon loai phong") Long roomId,
            @NotNull(message = "Chua chon ngay bat dau") LocalDate startDate,
            @NotNull(message = "Chua chon ngay ket thuc") LocalDate endDate,
            @NotNull(message = "Chua nhap so phong") @Min(value = 1, message = "So phong dong toi thieu la 1")
            @Max(value = 1000) Integer units,
            @Size(max = 255, message = "Ly do khong qua 255 ky tu") String reason) {}

    public record ClosureView(Long id, Long roomId, String roomType, LocalDate startDate, LocalDate endDate,
                              int units, String reason, Instant createdAt) {
        static ClosureView of(RoomClosure c) {
            return new ClosureView(c.getId(), c.getRoom().getId(), c.getRoom().getRoomType(), c.getStartDate(),
                    c.getEndDate(), c.getUnits(), c.getReason(), c.getCreatedAt());
        }
    }

    private final RoomRepository rooms;
    private final RoomClosureRepository closures;
    private final BookingRepository bookings;
    private final Clock clock;

    public PartnerInventoryService(RoomRepository rooms, RoomClosureRepository closures,
                                   BookingRepository bookings, Clock clock) {
        this.rooms = rooms;
        this.closures = closures;
        this.bookings = bookings;
        this.clock = clock;
    }

    /** Lich [from, from + days) cua moi loai phong trong co so. */
    @Transactional(readOnly = true)
    public CalendarView calendar(Long hotelId, LocalDate from, int days) {
        LocalDate start = from == null ? LocalDate.now(clock) : from;
        int span = Math.max(1, Math.min(days, MAX_CALENDAR_DAYS));
        LocalDate end = start.plusDays(span);

        List<Room> hotelRooms = rooms.findByHotelIdOrderByPricePerNightAscIdAsc(hotelId);
        List<Booking> occupying = bookings.findOccupyingByHotel(hotelId, start, end);
        List<RoomClosure> closed = closures.findActiveByHotel(hotelId, start.minusDays(1)).stream()
                .filter(c -> c.getStartDate().isBefore(end)).toList();

        List<RoomCalendar> out = new ArrayList<>();
        for (Room r : hotelRooms) {
            List<DayCell> cells = new ArrayList<>(span);
            for (int i = 0; i < span; i++) {
                LocalDate d = start.plusDays(i);
                int booked = (int) occupying.stream()
                        .filter(b -> b.getRoom().getId().equals(r.getId()) && covers(b.getCheckIn(), b.getCheckOut(), d))
                        .count();
                int shut = closed.stream()
                        .filter(c -> c.getRoom().getId().equals(r.getId()) && covers(c.getStartDate(), c.getEndDate(), d))
                        .mapToInt(RoomClosure::getUnits).sum();
                cells.add(new DayCell(d, booked, shut, Math.max(0, r.getQuantity() - booked - shut)));
            }
            out.add(new RoomCalendar(r.getId(), r.getRoomType(), r.getQuantity(), cells));
        }
        return new CalendarView(start, end, out);
    }

    @Transactional(readOnly = true)
    public List<ClosureView> closures(Long hotelId) {
        return closures.findActiveByHotel(hotelId, LocalDate.now(clock)).stream().map(ClosureView::of).toList();
    }

    /**
     * Dong phong: khong duoc dong qua so phong con trong o bat ky ngay nao trong khoang
     * (khong huy ngam don khach da dat). Khoa dong loai phong de khong chen ngang don dang tao.
     */
    @Transactional
    public ClosureView close(Long hotelId, ClosureRequest req) {
        LocalDate today = LocalDate.now(clock);
        if (req.startDate().isBefore(today)) {
            throw ApiException.badRequest("Khong the dong phong cho ngay da qua");
        }
        if (!req.endDate().isAfter(req.startDate())) {
            throw ApiException.badRequest("Ngay ket thuc phai sau ngay bat dau");
        }
        if (req.endDate().isAfter(today.plusDays(MAX_DAYS_AHEAD))) {
            throw ApiException.badRequest("Chi dong phong toi da " + MAX_DAYS_AHEAD + " ngay toi");
        }
        Room room = rooms.findByIdForUpdate(req.roomId())
                .orElseThrow(() -> ApiException.notFound("Khong tim thay loai phong"));
        if (!room.getHotel().getId().equals(hotelId)) {
            throw ApiException.forbidden("Ban chi dong duoc loai phong thuoc co so cua minh");
        }
        if (req.units() > room.getQuantity()) {
            throw ApiException.badRequest("Loai phong nay chi co " + room.getQuantity() + " phong");
        }
        long span = ChronoUnit.DAYS.between(req.startDate(), req.endDate());
        CalendarView cal = calendarForRoom(hotelId, room.getId(), req.startDate(), span);
        int minFree = cal.rooms().stream().flatMap(rc -> rc.days().stream())
                .mapToInt(DayCell::available).min().orElse(room.getQuantity());
        if (req.units() > minFree) {
            throw ApiException.conflict("Chi con " + minFree + " phong trong o ngay it nhat trong khoang da chon;"
                    + " khong the dong nhieu hon so phong con trong (don cua khach van giu nguyen)");
        }
        RoomClosure c = new RoomClosure();
        c.setRoom(room);
        c.setStartDate(req.startDate());
        c.setEndDate(req.endDate());
        c.setUnits(req.units());
        c.setReason(req.reason() == null || req.reason().isBlank() ? null : req.reason().trim());
        return ClosureView.of(closures.save(c));
    }

    @Transactional
    public void reopen(Long hotelId, Long closureId) {
        RoomClosure c = closures.findById(closureId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay lich dong phong"));
        if (!c.getRoom().getHotel().getId().equals(hotelId)) {
            throw ApiException.forbidden("Lich dong phong khong thuoc co so cua ban");
        }
        closures.delete(c);
    }

    private CalendarView calendarForRoom(Long hotelId, Long roomId, LocalDate from, long days) {
        // Khoang dong co the dai hon lich hien thi: tinh tung doan toi da MAX_CALENDAR_DAYS ngay
        List<RoomCalendar> merged = new ArrayList<>();
        List<DayCell> cells = new ArrayList<>();
        for (long offset = 0; offset < days; offset += MAX_CALENDAR_DAYS) {
            int chunk = (int) Math.min(MAX_CALENDAR_DAYS, days - offset);
            calendar(hotelId, from.plusDays(offset), chunk).rooms().stream()
                    .filter(rc -> rc.roomId().equals(roomId))
                    .forEach(rc -> cells.addAll(rc.days()));
        }
        merged.add(new RoomCalendar(roomId, null, 0, cells));
        return new CalendarView(from, from.plusDays(days), merged);
    }

    private static boolean covers(LocalDate start, LocalDate endExclusive, LocalDate day) {
        return !day.isBefore(start) && day.isBefore(endExclusive);
    }
}
