package com.quickstay.hotel.extras;

import com.quickstay.booking.BookingRepository;
import com.quickstay.booking.BookingStatus;
import com.quickstay.config.ApiException;
import com.quickstay.email.EmailService;
import com.quickstay.hotel.ContentLines;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.user.EmailVerificationPolicy;
import com.quickstay.user.Role;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class HotelExtrasService {

    public record PhotoItem(String url, String caption) {}
    public record TransferOption(String code, String title, String vehicle, int capacity, String duration, BigDecimal price) {}
    public record DiningOption(String name, String cuisine, String hours, String highlight, String priceNote) {}
    public record AttractionItem(String name, String distance, String transportMode, String estimatedDuration, BigDecimal price) {}
    public record AmenityCategory(String category, List<String> items) {}
    public record PolicyItem(String title, String detail) {}

    public record HotelExtrasView(
            Long hotelId,
            double averageRating,
            int reviewCount,
            List<PhotoItem> photos,
            String airportName,
            List<TransferOption> airportTransfers,
            List<DiningOption> diningOptions,
            List<AttractionItem> attractionTransports,
            List<AmenityCategory> categorizedAmenities,
            List<PolicyItem> policies,
            /** Nha hang & tour that (trang /restaurants, /tours) cung thanh pho voi khach san. */
            List<com.quickstay.venue.VenueDtos.RestaurantView> nearbyRestaurants,
            List<com.quickstay.venue.VenueDtos.TourView> nearbyTours) {}

    public record ReviewView(Long id, String authorName, int rating, String comment, String stayType, Instant createdAt) {
        static ReviewView of(HotelReview r) {
            return new ReviewView(r.getId(), r.getAuthorName(), r.getRating(), r.getComment(), r.getStayType(), r.getCreatedAt());
        }
    }

    public record CreateReviewRequest(
            @Min(1) @Max(5) int rating,
            @NotBlank @Size(max = 2000) String comment,
            @Size(max = 50) String stayType) {}

    public record QuestionView(Long id, String authorName, String question, String answer, String answeredBy, Instant createdAt) {
        static QuestionView of(HotelQuestion q) {
            return new QuestionView(q.getId(), q.getAuthorName(), q.getQuestion(), q.getAnswer(), q.getAnsweredBy(), q.getCreatedAt());
        }
    }

    public record CreateQuestionRequest(
            @Size(max = 100) String authorName,
            @NotBlank @Size(max = 1000) String question) {}

    public record AnswerQuestionRequest(@NotBlank @Size(max = 2000) String answer) {}

    public record CreateConciergeRequest(
            @NotBlank String serviceType,
            @NotBlank @Size(max = 255) String serviceTitle,
            @NotNull LocalDate serviceDate,
            @Size(max = 20) String serviceTime,
            @Min(1) @Max(20) int guests,
            @NotBlank @Size(max = 50) String guestPhone,
            @Size(max = 1000) String details,
            @PositiveOrZero BigDecimal estimatedFee) {}

    public record ConciergeView(
            Long id, Long hotelId, String hotelName, String guestName, String guestEmail, String guestPhone,
            String serviceType, String serviceTitle, LocalDate serviceDate, String serviceTime,
            int guests, String details, BigDecimal estimatedFee, String status, Instant createdAt) {
        static ConciergeView of(ConciergeRequest c) {
            return new ConciergeView(c.getId(), c.getHotel().getId(), c.getHotel().getName(),
                    c.getGuestName(), c.getGuestEmail(), c.getGuestPhone(), c.getServiceType(),
                    c.getServiceTitle(), c.getServiceDate(), c.getServiceTime(), c.getGuests(),
                    c.getDetails(), c.getEstimatedFee(), c.getStatus(), c.getCreatedAt());
        }
    }

    private final HotelRepository hotels;
    private final HotelReviewRepository reviews;
    private final HotelQuestionRepository questions;
    private final ConciergeRequestRepository concierges;
    private final UserRepository users;
    private final EmailService emails;
    private final BookingRepository bookings;
    private final EmailVerificationPolicy verification;
    private final Clock clock;
    private final com.quickstay.venue.VenueService venues;

    public HotelExtrasService(HotelRepository hotels, HotelReviewRepository reviews,
                              HotelQuestionRepository questions, ConciergeRequestRepository concierges,
                              UserRepository users, @Autowired(required = false) EmailService emails,
                              BookingRepository bookings, EmailVerificationPolicy verification, Clock clock,
                              com.quickstay.venue.VenueService venues) {
        this.venues = venues;
        this.bookings = bookings;
        this.verification = verification;
        this.clock = clock;
        this.hotels = hotels;
        this.reviews = reviews;
        this.questions = questions;
        this.concierges = concierges;
        this.users = users;
        this.emails = emails;
    }

    @Transactional(readOnly = true)
    public HotelExtrasView extras(Long hotelId) {
        Hotel h = findHotel(hotelId);

        // Tinh diem trung binh va so danh gia bang SQL index-only scan (khong can load toan bo row vao RAM).
        // Chua co danh gia thi diem = 0 (khong hien thi diem gia).
        List<Object[]> stats = reviews.getRatingStatsByHotelId(hotelId);
        long revCount = 0;
        double avg = 0;
        if (!stats.isEmpty() && stats.get(0) != null) {
            Object[] row = stats.get(0);
            revCount = row[0] instanceof Number ? ((Number) row[0]).longValue() : 0L;
            if (revCount > 0 && row[1] instanceof Number) {
                avg = Math.round(((Number) row[1]).doubleValue() * 10.0) / 10.0;
            }
        }

        // Toan bo noi dung duoi day do doi tac / admin nhap (trang Doi tac > Trang khach san); muc trong thi an.
        String cityLower = h.getCity() == null ? "" : h.getCity().toLowerCase(Locale.ROOT);
        List<PhotoItem> photos = photosOf(h);
        List<TransferOption> transfers = transfersOf(h);
        String airportName = h.getAirportName() != null ? h.getAirportName()
                : transfers.isEmpty() ? null : airportForCity(cityLower);
        List<DiningOption> dining = diningOf(h);
        List<AttractionItem> attractions = attractionsOf(h);
        List<String> amenityList = ContentLines.csv(h.getAmenities());
        List<AmenityCategory> amenities = amenityList.isEmpty() ? List.of()
                : List.of(new AmenityCategory("Tiện nghi tại cơ sở", amenityList));
        List<PolicyItem> policies = policiesOf(h);

        return new HotelExtrasView(hotelId, avg, (int) revCount, photos, airportName, transfers, dining, attractions, amenities, policies,
                venues.restaurantsInCity(h.getCity(), 4), venues.toursInCity(h.getCity(), 4));
    }

    @Transactional(readOnly = true)
    public List<ReviewView> reviewsOf(Long hotelId) {
        findHotel(hotelId);
        return reviews.findByHotelIdOrderByCreatedAtDescIdDesc(hotelId).stream().map(ReviewView::of).toList();
    }

    @Transactional
    public ReviewView addReview(Long hotelId, String userEmail, CreateReviewRequest req) {
        Hotel h = findHotel(hotelId);
        User u = users.findByEmail(userEmail).orElseThrow(() -> ApiException.unauthorized("Tai khoan khong ton tai"));
        if (u.getRole() != Role.CUSTOMER) {
            throw ApiException.forbidden("Chi khach luu tru moi duoc danh gia");
        }
        verification.requireVerified(u);
        // Chi khach da nhan phong / hoan tat ky nghi tai co so nay moi duoc danh gia, moi nguoi mot danh gia
        if (!bookings.existsByUserIdAndRoomHotelIdAndStatusIn(u.getId(), hotelId,
                List.of(BookingStatus.CHECKED_IN, BookingStatus.COMPLETED))) {
            throw ApiException.forbidden("Ban can luu tru tai co so nay truoc khi danh gia");
        }
        if (reviews.existsByHotelIdAndUserId(hotelId, u.getId())) {
            throw ApiException.conflict("Ban da danh gia co so nay");
        }
        HotelReview r = new HotelReview();
        r.setHotel(h);
        r.setUserId(u.getId());
        r.setAuthorName(u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getEmail());
        r.setRating(req.rating());
        r.setComment(req.comment().trim());
        r.setStayType(req.stayType() == null || req.stayType().isBlank() ? "Khách lưu trú" : req.stayType().trim());
        return ReviewView.of(reviews.save(r));
    }

    @Transactional(readOnly = true)
    public List<QuestionView> questionsOf(Long hotelId) {
        findHotel(hotelId);
        return questions.findByHotelIdOrderByCreatedAtDescIdDesc(hotelId).stream().map(QuestionView::of).toList();
    }

    @Transactional
    public QuestionView askQuestion(Long hotelId, String userEmail, CreateQuestionRequest req) {
        Hotel h = findHotel(hotelId);
        String author = req.authorName() != null && !req.authorName().isBlank() ? req.authorName().trim() : "Khách quan tâm";
        if (userEmail != null) {
            author = users.findByEmail(userEmail)
                    .map(u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getEmail())
                    .orElse(author);
        }
        HotelQuestion q = new HotelQuestion();
        q.setHotel(h);
        q.setAuthorName(author);
        q.setQuestion(req.question().trim());
        return QuestionView.of(questions.save(q));
    }

    /** Cau hoi cua co so do doi tac (HOTEL_MANAGER) phu trach. */
    @Transactional(readOnly = true)
    public List<QuestionView> questionsForPartner(String partnerEmail) {
        User u = users.findByEmail(partnerEmail).orElseThrow(() -> ApiException.unauthorized("Tai khoan khong ton tai"));
        if (u.getHotelId() == null) {
            return List.of();
        }
        return questionsOf(u.getHotelId());
    }

    /** Doi tac tra loi cau hoi: chi cau hoi thuoc co so cua minh (ADMIN tra loi moi co so). */
    @Transactional
    public QuestionView answerQuestionAsPartner(Long questionId, String partnerEmail, AnswerQuestionRequest req) {
        User u = users.findByEmail(partnerEmail).orElseThrow(() -> ApiException.unauthorized("Tai khoan khong ton tai"));
        HotelQuestion q = questions.findById(questionId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay cau hoi"));
        if (u.getRole() != Role.ADMIN && (u.getHotelId() == null || !u.getHotelId().equals(q.getHotel().getId()))) {
            throw ApiException.forbidden("Ban chi tra loi duoc cau hoi thuoc co so cua minh");
        }
        return answerQuestion(questionId, partnerEmail, req);
    }

    @Transactional
    public QuestionView answerQuestion(Long questionId, String adminEmail, AnswerQuestionRequest req) {
        HotelQuestion q = questions.findById(questionId)
                .orElseThrow(() -> ApiException.notFound("Khong tim thay cau hoi"));
        q.setAnswer(req.answer().trim());
        q.setAnsweredBy("Quản lý " + q.getHotel().getName());
        return QuestionView.of(questions.save(q));
    }

    @Transactional
    public ConciergeView createConcierge(Long hotelId, String userEmail, CreateConciergeRequest req) {
        Hotel h = findHotel(hotelId);
        User u = users.findByEmail(userEmail).orElseThrow(() -> ApiException.unauthorized("Tai khoan khong ton tai"));
        String type = req.serviceType().trim().toUpperCase(Locale.ROOT);
        if (!List.of("AIRPORT_TRANSFER", "DINING", "ATTRACTION_TRANSPORT").contains(type)) {
            throw ApiException.badRequest("Loai dich vu khong hop le");
        }
        verification.requireVerified(u);
        if (req.serviceDate().isBefore(LocalDate.now(clock))) {
            throw ApiException.badRequest("Ngay su dung dich vu khong duoc o qua khu");
        }
        if (req.serviceDate().isAfter(LocalDate.now(clock).plusDays(365))) {
            throw ApiException.badRequest("Chi nhan dat dich vu truoc toi da 365 ngay");
        }
        // Phi tinh tu bang gia doi tac da cong bo tren trang co so, bo qua estimatedFee client gui len.
        // Dich vu ngoai danh muc: cho co so bao gia (PENDING, phi 0).
        String title = req.serviceTitle().trim();
        Optional<BigDecimal> catalogFee = switch (type) {
            case "AIRPORT_TRANSFER" -> transfersOf(h).stream()
                    .filter(t -> t.title().equalsIgnoreCase(title) || t.code().equalsIgnoreCase(title))
                    .map(TransferOption::price).findFirst();
            case "ATTRACTION_TRANSPORT" -> attractionsOf(h).stream()
                    .filter(a -> a.name().equalsIgnoreCase(title))
                    .map(AttractionItem::price).findFirst();
            default -> Optional.of(BigDecimal.ZERO); // Am thuc: thanh toan tai nha hang
        };
        ConciergeRequest c = new ConciergeRequest();
        c.setHotel(h);
        c.setUserId(u.getId());
        c.setGuestName(u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getEmail());
        c.setGuestEmail(u.getEmail());
        c.setGuestPhone(req.guestPhone().trim());
        c.setServiceType(type);
        c.setServiceTitle(req.serviceTitle().trim());
        c.setServiceDate(req.serviceDate());
        c.setServiceTime(req.serviceTime() == null ? null : req.serviceTime().trim());
        c.setGuests(req.guests());
        c.setDetails(req.details() == null ? null : req.details().trim());
        c.setEstimatedFee(catalogFee.orElse(BigDecimal.ZERO));
        c.setStatus(catalogFee.isPresent() ? "CONFIRMED" : "PENDING");
        concierges.save(c);

        if (emails != null) {
            String label = switch (type) {
                case "AIRPORT_TRANSFER" -> "Đưa đón sân bay";
                case "DINING" -> "Đặt bàn & Ẩm thực";
                default -> "Hỗ trợ xe tham quan";
            };
            emails.sendConciergeConfirmationEmail(
                    c.getGuestEmail(), c.getGuestName(), h.getName(), label,
                    c.getServiceTitle(), c.getServiceDate().toString(), c.getServiceTime(),
                    c.getGuests(), c.getEstimatedFee(), c.getDetails());
        }
        return ConciergeView.of(c);
    }

    @Transactional(readOnly = true)
    public List<ConciergeView> myConcierge(String userEmail) {
        return concierges.findByGuestEmailOrderByCreatedAtDescIdDesc(userEmail).stream().map(ConciergeView::of).toList();
    }

    @Transactional(readOnly = true)
    public List<ConciergeView> allConcierge() {
        return concierges.findAllByOrderByCreatedAtDescIdDesc().stream().map(ConciergeView::of).toList();
    }

    private Hotel findHotel(Long id) {
        return hotels.findById(id).orElseThrow(() -> ApiException.notFound("Khong tim thay khach san"));
    }

    /** Chinh sach chung cua nen tang, hien thi tren moi co so (khop logic huy / hoan tien trong BookingService). */
    static final List<PolicyItem> PLATFORM_POLICIES = List.of(
            new PolicyItem("Hủy phòng & Hoàn tiền (QuickStay)",
                    "Hủy miễn phí trên QuickStay đến hết ngày trước ngày nhận phòng, áp dụng cho đơn Chờ xác nhận và Đã xác nhận. "
                            + "Đơn đã thanh toán trực tuyến được hoàn 100%. Từ ngày nhận phòng, vui lòng liên hệ trực tiếp cơ sở."),
            new PolicyItem("Thanh toán",
                    "Thanh toán tại cơ sở khi nhận phòng hoặc thanh toán trực tuyến trên QuickStay. Giá hiển thị là tổng tiền phòng theo số đêm, "
                            + "QuickStay không thu thêm phí đặt phòng. Dịch vụ đưa đón, ăn uống thanh toán trực tiếp với cơ sở.")
    );

    private static List<PolicyItem> policiesOf(Hotel h) {
        List<PolicyItem> list = new ArrayList<>();
        String in = h.getCheckInTime() == null ? "14:00" : h.getCheckInTime();
        String out = h.getCheckOutTime() == null ? "12:00" : h.getCheckOutTime();
        list.add(new PolicyItem("Nhận phòng & Trả phòng", "Nhận phòng từ " + in + " · Trả phòng trước " + out + "."));
        for (String line : ContentLines.lines(h.getHouseRules())) {
            String[] c = ContentLines.cells(line, 2);
            list.add(c[1].isEmpty() ? new PolicyItem("Quy định của cơ sở", c[0]) : new PolicyItem(c[0], c[1]));
        }
        list.addAll(PLATFORM_POLICIES);
        return list;
    }

    private static List<PhotoItem> photosOf(Hotel h) {
        List<PhotoItem> list = new ArrayList<>();
        if (h.getImageUrl() != null && !h.getImageUrl().isBlank()) {
            list.add(new PhotoItem(h.getImageUrl(), h.getName()));
        }
        for (String line : ContentLines.lines(h.getGallery())) {
            String[] c = ContentLines.cells(line, 2);
            if (ContentLines.isUrl(c[0]) && list.stream().noneMatch(p -> p.url().equals(c[0]))) {
                list.add(new PhotoItem(c[0], c[1].isEmpty() ? h.getName() : c[1]));
            }
        }
        return list;
    }

    static List<TransferOption> transfersOf(Hotel h) {
        List<TransferOption> list = new ArrayList<>();
        int i = 0;
        for (String line : ContentLines.lines(h.getTransfers())) {
            String[] c = ContentLines.cells(line, 5);
            i++;
            int seats;
            try {
                seats = c[2].isEmpty() ? 0 : Integer.parseInt(c[2].replaceAll("\\D", ""));
            } catch (NumberFormatException e) {
                seats = 0;
            }
            list.add(new TransferOption("T" + i, c[0], c[1], seats, c[3], safePrice(c[4])));
        }
        return list;
    }

    private static List<DiningOption> diningOf(Hotel h) {
        return ContentLines.lines(h.getDining()).stream().map(line -> {
            String[] c = ContentLines.cells(line, 5);
            return new DiningOption(c[0], c[1], c[2], c[3], c[4]);
        }).toList();
    }

    static List<AttractionItem> attractionsOf(Hotel h) {
        return ContentLines.lines(h.getAttractions()).stream().map(line -> {
            String[] c = ContentLines.cells(line, 5);
            return new AttractionItem(c[0], c[1], c[2], c[3], safePrice(c[4]));
        }).toList();
    }

    private static BigDecimal safePrice(String cell) {
        try {
            return ContentLines.price(cell);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private static String airportForCity(String city) {
        if (city.contains("đà nẵng") || city.contains("hội an")) return "Sân bay Quốc tế Đà Nẵng (DAD)";
        if (city.contains("hà nội")) return "Sân bay Quốc tế Nội Bài (HAN)";
        if (city.contains("hồ chí minh")) return "Sân bay Quốc tế Tân Sơn Nhất (SGN)";
        if (city.contains("phú quốc")) return "Sân bay Quốc tế Phú Quốc (PQC)";
        if (city.contains("nha trang")) return "Sân bay Quốc tế Cam Ranh (CXR)";
        if (city.contains("đà lạt")) return "Sân bay Liên Khương (DLI)";
        if (city.contains("huế")) return "Sân bay Quốc tế Phú Bài (HUI)";
        return "Sân bay nội địa / Quốc tế gần nhất";
    }
}
