package com.quickstay.venue;

import com.quickstay.config.ApiException;
import com.quickstay.email.EmailService;
import com.quickstay.user.EmailVerificationPolicy;
import com.quickstay.user.Role;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import com.quickstay.venue.VenueDtos.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * Nha hang & tour: danh sach cong khai, quan tri (ADMIN), quan ly boi chu co so (RESTAURANT_OWNER / TOUR_OPERATOR)
 * va don dat ban / dat tour cua khach.
 */
@Service
public class VenueService {

    private static final Logger log = LoggerFactory.getLogger(VenueService.class);
    static final int MAX_DAYS_AHEAD = 365;

    private final RestaurantRepository restaurants;
    private final TourRepository tours;
    private final RestaurantReservationRepository reservations;
    private final TourBookingRepository tourBookings;
    private final UserRepository users;
    private final EmailVerificationPolicy verification;
    private final Clock clock;
    private final EmailService emails;

    public VenueService(RestaurantRepository restaurants, TourRepository tours,
                        RestaurantReservationRepository reservations, TourBookingRepository tourBookings,
                        UserRepository users, EmailVerificationPolicy verification, Clock clock,
                        @Autowired(required = false) EmailService emails) {
        this.restaurants = restaurants;
        this.tours = tours;
        this.reservations = reservations;
        this.tourBookings = tourBookings;
        this.users = users;
        this.verification = verification;
        this.clock = clock;
        this.emails = emails;
    }

    // =====================================================================
    // Cong khai
    // =====================================================================

    @Transactional(readOnly = true)
    public List<RestaurantView> listRestaurants() {
        return restaurants.findAllByOrderByIdAsc().stream().map(RestaurantView::of).toList();
    }

    @Transactional(readOnly = true)
    public List<TourView> listTours() {
        return tours.findAllByOrderByIdAsc().stream().map(TourView::of).toList();
    }

    // =====================================================================
    // Admin: them / sua / xoa
    // =====================================================================

    @Transactional
    public RestaurantView createRestaurant(RestaurantRequest req) {
        Restaurant r = new Restaurant();
        apply(r, req);
        return RestaurantView.of(restaurants.save(r));
    }

    @Transactional
    public RestaurantView updateRestaurant(Long id, RestaurantRequest req) {
        Restaurant r = findRestaurant(id);
        apply(r, req);
        return RestaurantView.of(r);
    }

    @Transactional
    public void deleteRestaurant(Long id) {
        Restaurant r = findRestaurant(id);
        if (reservations.existsByRestaurantId(id)) {
            throw ApiException.conflict("Nha hang da co don dat ban, khong the xoa");
        }
        restaurants.delete(r);
    }

    @Transactional
    public TourView createTour(TourRequest req) {
        Tour t = new Tour();
        apply(t, req);
        return TourView.of(tours.save(t));
    }

    @Transactional
    public TourView updateTour(Long id, TourRequest req) {
        Tour t = findTour(id);
        apply(t, req);
        return TourView.of(t);
    }

    @Transactional
    public void deleteTour(Long id) {
        Tour t = findTour(id);
        if (tourBookings.existsByTourId(id)) {
            throw ApiException.conflict("Tour da co don dat, khong the xoa");
        }
        tours.delete(t);
    }

    @Transactional(readOnly = true)
    public List<ReservationView> allReservations() {
        return reservations.findAllByOrderByCreatedAtDescIdDesc().stream().map(ReservationView::of).toList();
    }

    @Transactional(readOnly = true)
    public List<TourBookingView> allTourBookings() {
        return tourBookings.findAllByOrderByCreatedAtDescIdDesc().stream().map(TourBookingView::of).toList();
    }

    // =====================================================================
    // Gan co so cho tai khoan doi tac (goi tu AdminPartnerController)
    // =====================================================================

    /**
     * Dat danh sach nha hang (RESTAURANT_OWNER) hoac tour (TOUR_OPERATOR) cua doi tac dung bang ids:
     * them cac muc moi, go cac muc khong con trong danh sach. Muc dang thuoc doi tac khac thi 409.
     */
    @Transactional
    public void assignListings(User owner, Collection<Long> ids) {
        Set<Long> wanted = new HashSet<>(ids == null ? List.of() : ids);
        if (owner.getRole() == Role.RESTAURANT_OWNER) {
            List<Restaurant> found = restaurants.findByIdIn(wanted);
            if (found.size() != wanted.size()) throw ApiException.badRequest("Co nha hang khong ton tai");
            for (Restaurant r : found) {
                if (r.getOwner() != null && !r.getOwner().getId().equals(owner.getId())) {
                    throw ApiException.conflict("Nha hang \"" + r.getName() + "\" da thuoc doi tac khac");
                }
            }
            restaurants.findByOwnerIdOrderByIdAsc(owner.getId()).stream()
                    .filter(r -> !wanted.contains(r.getId())).forEach(r -> r.setOwner(null));
            found.forEach(r -> r.setOwner(owner));
        } else if (owner.getRole() == Role.TOUR_OPERATOR) {
            List<Tour> found = tours.findByIdIn(wanted);
            if (found.size() != wanted.size()) throw ApiException.badRequest("Co tour khong ton tai");
            for (Tour t : found) {
                if (t.getOwner() != null && !t.getOwner().getId().equals(owner.getId())) {
                    throw ApiException.conflict("Tour \"" + t.getTitle() + "\" da thuoc doi tac khac");
                }
            }
            tours.findByOwnerIdOrderByIdAsc(owner.getId()).stream()
                    .filter(t -> !wanted.contains(t.getId())).forEach(t -> t.setOwner(null));
            found.forEach(t -> t.setOwner(owner));
        }
    }

    /** Ten cac co so cua doi tac nha hang / tour (de hien thi trong danh sach doi tac). */
    @Transactional(readOnly = true)
    public List<Listing> listingsOf(User owner) {
        if (owner.getRole() == Role.RESTAURANT_OWNER) {
            return restaurants.findByOwnerIdOrderByIdAsc(owner.getId()).stream()
                    .map(r -> new Listing(r.getId(), r.getName(), r.getCity())).toList();
        }
        if (owner.getRole() == Role.TOUR_OPERATOR) {
            return tours.findByOwnerIdOrderByIdAsc(owner.getId()).stream()
                    .map(t -> new Listing(t.getId(), t.getTitle(), t.getCity())).toList();
        }
        return List.of();
    }

    public record Listing(Long id, String name, String city) {}

    // =====================================================================
    // Chu co so
    // =====================================================================

    @Transactional(readOnly = true)
    public List<RestaurantView> myRestaurants(String email) {
        User u = currentUser(email);
        if (u.getRole() == Role.ADMIN) return listRestaurants();
        return restaurants.findByOwnerIdOrderByIdAsc(u.getId()).stream().map(RestaurantView::of).toList();
    }

    @Transactional(readOnly = true)
    public List<TourView> myTours(String email) {
        User u = currentUser(email);
        if (u.getRole() == Role.ADMIN) return listTours();
        return tours.findByOwnerIdOrderByIdAsc(u.getId()).stream().map(TourView::of).toList();
    }

    @Transactional
    public RestaurantView updateRestaurantAsOwner(String email, Long id, RestaurantRequest req) {
        Restaurant r = findRestaurant(id);
        requireOwner(currentUser(email), r.getOwner());
        apply(r, req);
        log.info("Chu nha hang {} cap nhat nha hang #{}", email, id);
        return RestaurantView.of(r);
    }

    @Transactional
    public TourView updateTourAsOwner(String email, Long id, TourRequest req) {
        Tour t = findTour(id);
        requireOwner(currentUser(email), t.getOwner());
        apply(t, req);
        log.info("Chu tour {} cap nhat tour #{}", email, id);
        return TourView.of(t);
    }

    @Transactional(readOnly = true)
    public List<ReservationView> ownerReservations(String email) {
        User u = currentUser(email);
        if (u.getRole() == Role.ADMIN) return allReservations();
        return reservations.findByRestaurantOwnerIdOrderByCreatedAtDescIdDesc(u.getId()).stream()
                .map(ReservationView::of).toList();
    }

    @Transactional(readOnly = true)
    public List<TourBookingView> ownerTourBookings(String email) {
        User u = currentUser(email);
        if (u.getRole() == Role.ADMIN) return allTourBookings();
        return tourBookings.findByTourOwnerIdOrderByCreatedAtDescIdDesc(u.getId()).stream()
                .map(TourBookingView::of).toList();
    }

    @Transactional
    public ReservationView changeReservationStatus(String email, Long id, OrderStatus status) {
        RestaurantReservation r = reservations.findByIdForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don dat ban"));
        requireOwner(currentUser(email), r.getRestaurant().getOwner());
        transition(r.getStatus(), status);
        r.setStatus(status);
        notifyReservation(r, "Cập nhật đơn đặt bàn #" + r.getId() + " - " + status.label(),
                "Trạng thái đơn đặt bàn của bạn đã được cập nhật.");
        return ReservationView.of(r);
    }

    @Transactional
    public TourBookingView changeTourBookingStatus(String email, Long id, OrderStatus status) {
        TourBooking b = tourBookings.findByIdForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don dat tour"));
        requireOwner(currentUser(email), b.getTour().getOwner());
        transition(b.getStatus(), status);
        b.setStatus(status);
        notifyTourBooking(b, "Cập nhật đơn đặt tour #" + b.getId() + " - " + status.label(),
                "Trạng thái đơn đặt tour của bạn đã được cập nhật.");
        return TourBookingView.of(b);
    }

    // =====================================================================
    // Khach hang
    // =====================================================================

    @Transactional
    public ReservationView reserve(String email, Long restaurantId, ReservationRequest req) {
        User u = currentUser(email);
        verification.requireVerified(u);
        Restaurant rest = findRestaurant(restaurantId);
        LocalDate today = LocalDate.now(clock);
        if (req.date().isBefore(today)) throw ApiException.badRequest("Ngay dat ban khong duoc o qua khu");
        if (req.date().isAfter(today.plusDays(MAX_DAYS_AHEAD))) {
            throw ApiException.badRequest("Chi nhan dat ban truoc toi da " + MAX_DAYS_AHEAD + " ngay");
        }
        if (req.date().equals(today) && !LocalTime.parse(req.time()).isAfter(LocalTime.now(clock))) {
            throw ApiException.badRequest("Gio dat ban da qua");
        }
        RestaurantReservation r = new RestaurantReservation();
        r.setRestaurant(rest);
        r.setUser(u);
        r.setGuestName(req.guestName().trim());
        r.setGuestPhone(req.guestPhone().trim());
        r.setReservationDate(req.date());
        r.setReservationTime(req.time());
        r.setPartySize(req.partySize());
        r.setSeatingArea(VenueDtos.trimToNull(req.seatingArea()));
        r.setNote(VenueDtos.trimToNull(req.note()));
        r.setStatus(OrderStatus.PENDING);
        reservations.save(r);
        log.info("Dat ban moi #{} nha hang #{}", r.getId(), restaurantId);
        notifyReservation(r, "Đã nhận yêu cầu đặt bàn #" + r.getId() + " - " + rest.getName(),
                "Nhà hàng đã nhận yêu cầu đặt bàn của bạn và sẽ xác nhận sớm.");
        notifyOwner(rest.getOwner(), "Đơn đặt bàn mới #" + r.getId(),
                "Có đơn đặt bàn mới tại " + rest.getName() + " ngày " + r.getReservationDate() + " lúc " + r.getReservationTime()
                        + " (" + r.getPartySize() + " khách).");
        return ReservationView.of(r);
    }

    @Transactional
    public TourBookingView bookTour(String email, Long tourId, TourBookingRequest req) {
        User u = currentUser(email);
        verification.requireVerified(u);
        Tour t = findTour(tourId);
        LocalDate today = LocalDate.now(clock);
        if (!req.date().isAfter(today)) throw ApiException.badRequest("Ngay khoi hanh phai tu ngay mai tro di");
        if (req.date().isAfter(today.plusDays(MAX_DAYS_AHEAD))) {
            throw ApiException.badRequest("Chi nhan dat tour truoc toi da " + MAX_DAYS_AHEAD + " ngay");
        }
        TourBooking b = new TourBooking();
        b.setTour(t);
        b.setUser(u);
        b.setGuestName(req.guestName().trim());
        b.setGuestPhone(req.guestPhone().trim());
        b.setTourDate(req.date());
        b.setGuests(req.guests());
        b.setVehicle(req.vehicle() == null ? "SEDAN_4" : req.vehicle());
        b.setNote(VenueDtos.trimToNull(req.note()));
        // Gia tinh o server: gia moi khach x so khach (khong tin gia client gui)
        b.setTotalPrice(t.getPrice().multiply(BigDecimal.valueOf(req.guests())));
        b.setStatus(OrderStatus.PENDING);
        tourBookings.save(b);
        log.info("Dat tour moi #{} tour #{}", b.getId(), tourId);
        notifyTourBooking(b, "Đã nhận yêu cầu đặt tour #" + b.getId() + " - " + t.getTitle(),
                "Đơn vị tổ chức tour đã nhận yêu cầu của bạn và sẽ xác nhận sớm.");
        notifyOwner(t.getOwner(), "Đơn đặt tour mới #" + b.getId(),
                "Có đơn đặt tour mới: " + t.getTitle() + " ngày " + b.getTourDate() + " (" + b.getGuests() + " khách).");
        return TourBookingView.of(b);
    }

    @Transactional(readOnly = true)
    public List<ReservationView> myReservations(String email) {
        return reservations.findByUserIdOrderByCreatedAtDescIdDesc(currentUser(email).getId()).stream()
                .map(ReservationView::of).toList();
    }

    @Transactional(readOnly = true)
    public List<TourBookingView> myTourBookings(String email) {
        return tourBookings.findByUserIdOrderByCreatedAtDescIdDesc(currentUser(email).getId()).stream()
                .map(TourBookingView::of).toList();
    }

    /** Khach huy don cua minh khi chua hoan tat va chua toi ngay. */
    @Transactional
    public ReservationView cancelReservation(String email, Long id) {
        RestaurantReservation r = reservations.findByIdForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don dat ban"));
        if (!r.getUser().getEmail().equals(email)) throw ApiException.forbidden("Ban khong co quyen huy don nay");
        requireCancellable(r.getStatus(), r.getReservationDate());
        r.setStatus(OrderStatus.CANCELLED);
        notifyReservation(r, "Đã huỷ đơn đặt bàn #" + r.getId(), "Đơn đặt bàn của bạn đã được huỷ theo yêu cầu.");
        return ReservationView.of(r);
    }

    @Transactional
    public TourBookingView cancelTourBooking(String email, Long id) {
        TourBooking b = tourBookings.findByIdForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay don dat tour"));
        if (!b.getUser().getEmail().equals(email)) throw ApiException.forbidden("Ban khong co quyen huy don nay");
        requireCancellable(b.getStatus(), b.getTourDate());
        b.setStatus(OrderStatus.CANCELLED);
        notifyTourBooking(b, "Đã huỷ đơn đặt tour #" + b.getId(), "Đơn đặt tour của bạn đã được huỷ theo yêu cầu.");
        return TourBookingView.of(b);
    }

    // =====================================================================
    // Tien ich
    // =====================================================================

    private void requireCancellable(OrderStatus status, LocalDate date) {
        if (status != OrderStatus.PENDING && status != OrderStatus.CONFIRMED) {
            throw ApiException.conflict("Don da " + status.label().toLowerCase() + ", khong the huy");
        }
        if (date.isBefore(LocalDate.now(clock))) {
            throw ApiException.conflict("Da qua ngay su dung dich vu, khong the huy");
        }
    }

    private static void transition(OrderStatus from, OrderStatus to) {
        if (!from.next().contains(to)) {
            throw ApiException.conflict("Khong the chuyen trang thai tu " + from + " sang " + to);
        }
    }

    /** ADMIN thao tac moi co so; chu co so chi thao tac co so cua minh. */
    private static void requireOwner(User u, User owner) {
        if (u.getRole() == Role.ADMIN) return;
        if (owner == null || !Objects.equals(owner.getId(), u.getId())) {
            throw ApiException.forbidden("Ban chi co quyen quan ly co so duoc phan cong");
        }
    }

    private User currentUser(String email) {
        return users.findByEmail(email).orElseThrow(() -> ApiException.unauthorized("Tai khoan khong ton tai"));
    }

    private Restaurant findRestaurant(Long id) {
        return restaurants.findById(id).orElseThrow(() -> ApiException.notFound("Khong tim thay nha hang"));
    }

    private Tour findTour(Long id) {
        return tours.findById(id).orElseThrow(() -> ApiException.notFound("Khong tim thay tour"));
    }

    private static void apply(Restaurant r, RestaurantRequest req) {
        r.setName(req.name().trim());
        r.setCity(req.city().trim());
        r.setCuisine(VenueDtos.trimToNull(req.cuisine()));
        r.setAddress(VenueDtos.trimToNull(req.address()));
        r.setImageUrl(VenueDtos.trimToNull(req.image()));
        r.setOpeningHours(VenueDtos.trimToNull(req.hours()));
        r.setPriceRange(VenueDtos.trimToNull(req.priceRange()));
        r.setSpecialties(VenueDtos.joinLines(req.specialties()));
        r.setDescription(VenueDtos.trimToNull(req.description()));
    }

    private static void apply(Tour t, TourRequest req) {
        t.setTitle(req.title().trim());
        t.setCity(req.city().trim());
        t.setCategory(VenueDtos.trimToNull(req.category()));
        t.setImageUrl(VenueDtos.trimToNull(req.image()));
        t.setDuration(VenueDtos.trimToNull(req.duration()));
        t.setPrice(req.price());
        t.setTransport(VenueDtos.trimToNull(req.transport()));
        t.setHighlights(VenueDtos.joinLines(req.highlights()));
        t.setDescription(VenueDtos.trimToNull(req.description()));
    }

    private void notifyReservation(RestaurantReservation r, String subject, String intro) {
        if (emails == null) return;
        emails.sendVenueOrderEmail(r.getUser().getEmail(), r.getGuestName(), subject, intro, new String[][]{
                {"Nhà hàng", r.getRestaurant().getName()},
                {"Ngày", r.getReservationDate().toString()},
                {"Giờ", r.getReservationTime()},
                {"Số khách", r.getPartySize() + " khách"},
                {"Trạng thái", r.getStatus().label()},
                {"Ghi chú", r.getNote() == null ? "Không có" : r.getNote()}
        }, subject, "RESTAURANT_RESERVATION");
    }

    private void notifyTourBooking(TourBooking b, String subject, String intro) {
        if (emails == null) return;
        emails.sendVenueOrderEmail(b.getUser().getEmail(), b.getGuestName(), subject, intro, new String[][]{
                {"Tour", b.getTour().getTitle()},
                {"Ngày khởi hành", b.getTourDate().toString()},
                {"Số khách", b.getGuests() + " khách"},
                {"Tổng tiền dự kiến", EmailService.vnd(b.getTotalPrice())},
                {"Trạng thái", b.getStatus().label()},
                {"Ghi chú", b.getNote() == null ? "Không có" : b.getNote()}
        }, subject, "TOUR_BOOKING");
    }

    private void notifyOwner(User owner, String subject, String text) {
        if (emails == null || owner == null) return;
        emails.sendVenueOrderEmail(owner.getEmail(), owner.getFullName(), subject, text,
                new String[][]{{"Xử lý đơn", "Đăng nhập Cổng đối tác QuickStay để xác nhận"}}, subject, "PARTNER_NEW_ORDER");
    }
}
