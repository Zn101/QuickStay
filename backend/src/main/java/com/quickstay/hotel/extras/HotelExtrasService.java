package com.quickstay.hotel.extras;

import com.quickstay.config.ApiException;
import com.quickstay.email.EmailService;
import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import com.quickstay.user.User;
import com.quickstay.user.UserRepository;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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
            List<PolicyItem> policies) {}

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

    public HotelExtrasService(HotelRepository hotels, HotelReviewRepository reviews,
                              HotelQuestionRepository questions, ConciergeRequestRepository concierges,
                              UserRepository users, @Autowired(required = false) EmailService emails) {
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
        List<HotelReview> revList = reviews.findByHotelIdOrderByCreatedAtDescIdDesc(hotelId);
        double avg = revList.isEmpty() ? 4.8
                : Math.round(revList.stream().mapToInt(HotelReview::getRating).average().orElse(4.8) * 10.0) / 10.0;

        String cityLower = h.getCity() == null ? "" : h.getCity().toLowerCase(Locale.ROOT);
        String airportName = airportForCity(cityLower);
        List<PhotoItem> photos = buildPhotos(h);
        List<TransferOption> transfers = List.of(
                new TransferOption("SEDAN_4", "Xe Sedan 4 chỗ riêng tư", "Toyota Vios / Mazda 3", 3, "20 - 30 phút", BigDecimal.valueOf(250_000)),
                new TransferOption("SUV_7", "Xe SUV 7 chỗ gia đình", "Toyota Fortuner / Innova", 6, "20 - 30 phút", BigDecimal.valueOf(380_000)),
                new TransferOption("LIMO_VIP", "Limousine DCar VIP đón bảng tên", "Ford Transit Limousine", 9, "20 - 30 phút", BigDecimal.valueOf(650_000))
        );
        List<DiningOption> dining = diningForHotel(h);
        List<AttractionItem> attractions = attractionsForCity(cityLower);
        List<AmenityCategory> amenities = buildAmenities(h);
        List<PolicyItem> policies = List.of(
                new PolicyItem("Nhận phòng & Trả phòng", "Nhận phòng từ 14:00 · Trả phòng trước 12:00. Hỗ trợ giữ hành lý miễn phí 24/7 và nhận phòng sớm tùy tình trạng phòng trống."),
                new PolicyItem("Chính sách hủy & Hoàn tiền", "Miễn phí hủy phòng trước 24 giờ so với ngày nhận phòng. Đơn đã thanh toán trực tuyến sẽ được tự động hoàn tiền khi hủy hợp lệ ở trạng thái Chờ xác nhận."),
                new PolicyItem("Trẻ em & Giường phụ", "Miễn phí tối đa 1 trẻ em dưới 6 tuổi ngủ chung giường với bố mẹ. Giường phụ có thể yêu cầu thêm tại quầy lễ tân."),
                new PolicyItem("Thanh toán & Đặt cọc", "Chấp nhận thanh toán tại khách sạn, chuyển khoản VietQR, thẻ Visa/Mastercard và ví điện tử MoMo/VNPay."),
                new PolicyItem("Quy định lưu trú", "Không hút thuốc trong phòng kín. Vui lòng xuất trình CCCD/Hộ chiếu hợp lệ khi nhận phòng.")
        );

        return new HotelExtrasView(hotelId, avg, revList.size(), photos, airportName, transfers, dining, attractions, amenities, policies);
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
        c.setEstimatedFee(req.estimatedFee() == null ? BigDecimal.ZERO : req.estimatedFee());
        c.setStatus("CONFIRMED");
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

    private static List<PhotoItem> buildPhotos(Hotel h) {
        List<PhotoItem> list = new ArrayList<>();
        if (h.getImageUrl() != null && !h.getImageUrl().isBlank()) {
            list.add(new PhotoItem(h.getImageUrl(), "Toàn cảnh " + h.getName()));
        }
        list.add(new PhotoItem("https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80", "Phòng ngủ cao cấp ngập tràn ánh sáng"));
        list.add(new PhotoItem("https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80", "Không gian Suite & Ban công thư giãn"));
        list.add(new PhotoItem("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80", "Nhà hàng & Khu vực ẩm thực"));
        list.add(new PhotoItem("https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80", "Khu vực hồ bơi & sảnh đón tiếp"));
        return list;
    }

    private static String airportForCity(String city) {
        if (city.contains("đà nẵng") || city.contains("hội an")) return "Sân bay Quốc tế Đà Nẵng (DAD)";
        if (city.contains("hà nội")) return "Sân bay Quốc tế Nội Bài (HAN)";
        if (city.contains("hồ chí minh")) return "Sân bay Quốc tế Tân Sơn Nhất (SGN)";
        if (city.contains("phú quốc")) return "Sân bay Quốc tế Phú Quốc (PQC)";
        if (city.contains("nha trang")) return "Sân bay Quốc tế Cam Ranh (CXR)";
        if (city.contains("đà lạt")) return "Sân bay Liên Khương (DLI)";
        return "Sân bay nội địa / Quốc tế gần nhất";
    }

    private static List<DiningOption> diningForHotel(Hotel h) {
        return List.of(
                new DiningOption("Buffet Sáng QuickStay Bistro", "Á - Âu & Đặc sản địa phương", "06:30 – 10:00",
                        "Hơn 40 món nóng, quầy phở/bún đặc sản, bánh ngọt & trái cây tươi", "Miễn phí theo hạng phòng hoặc 180.000 ₫/khách"),
                new DiningOption("Nhà hàng " + h.getCity() + " Kitchen", "Ẩm thực bản địa & Hải sản", "11:00 – 22:00",
                        "Thực đơn gọi món theo mùa, không gian ấm cúng phù hợp gia đình & đối tác", "Từ 150.000 ₫/món"),
                new DiningOption("Sky Lounge & Coffee Bar", "Đồ uống & Bánh ngọt", "08:00 – 23:00",
                        "Cà phê pha máy, cocktail hoàng hôn & trà chiều", "Từ 55.000 ₫"),
                new DiningOption("Phục vụ tại phòng (In-room Dining)", "Thực đơn nhanh 24/7", "24/7",
                        "Giao đồ ăn nóng tận cửa phòng trong 25 phút", "Phục vụ mọi khung giờ")
        );
    }

    private static List<AttractionItem> attractionsForCity(String city) {
        if (city.contains("đà nẵng")) {
            return List.of(
                    new AttractionItem("Bà Nà Hills & Cầu Vàng", "25 km", "Xe riêng 4-7 chỗ có tài xế", "45 phút", BigDecimal.valueOf(550_000)),
                    new AttractionItem("Danh thắng Ngũ Hành Sơn", "8 km", "Taxi / Xe công nghệ / Xe máy", "15 phút", BigDecimal.valueOf(150_000)),
                    new AttractionItem("Bán đảo Sơn Trà & Chùa Linh Ứng", "10 km", "Xe máy thuê hoặc xe 4 chỗ", "20 phút", BigDecimal.valueOf(180_000)),
                    new AttractionItem("Phố cổ Hội An (Xe ghép/Riêng)", "28 km", "Shuttle bus hoặc Xe riêng", "40 phút", BigDecimal.valueOf(350_000))
            );
        }
        if (city.contains("hà nội")) {
            return List.of(
                    new AttractionItem("Hồ Hoàn Kiếm & Đền Ngọc Sơn", "500 m", "Đi bộ hoặc Xích lô phố cổ", "5 phút", BigDecimal.ZERO),
                    new AttractionItem("Lăng Chủ tịch Hồ Chí Minh & Chùa Một Cột", "2.8 km", "Xe điện / Taxi đặt tại lễ tân", "10 phút", BigDecimal.valueOf(90_000)),
                    new AttractionItem("Văn Miếu - Quốc Tử Giám", "2.5 km", "Xe điện du lịch / Grab", "10 phút", BigDecimal.valueOf(80_000)),
                    new AttractionItem("Tour Làng gốm Bát Tràng / Tràng An", "15 - 90 km", "Xe du lịch riêng theo ngày", "30 - 90 phút", BigDecimal.valueOf(650_000))
            );
        }
        if (city.contains("hồ chí minh")) {
            return List.of(
                    new AttractionItem("Chợ Bến Thành & Phố đi bộ Nguyễn Huệ", "400 m", "Đi bộ trực tiếp từ khách sạn", "5 phút", BigDecimal.ZERO),
                    new AttractionItem("Dinh Độc Lập & Nhà thờ Đức Bà", "1.1 km", "Xe đạp / Taxi / Đi bộ", "6 phút", BigDecimal.valueOf(60_000)),
                    new AttractionItem("Bến Bạch Đằng & Waterbus sông Sài Gòn", "900 m", "Đi bộ / Xe điện", "5 phút", BigDecimal.valueOf(50_000)),
                    new AttractionItem("Địa đạo Củ Chi (Nửa ngày)", "55 km", "Xe riêng 4-7 chỗ đón tận sảnh", "75 phút", BigDecimal.valueOf(950_000))
            );
        }
        if (city.contains("hội an")) {
            return List.of(
                    new AttractionItem("Phố cổ Hội An & Chùa Cầu", "600 m", "Xe đạp miễn phí của homestay / Đi bộ", "5 phút", BigDecimal.ZERO),
                    new AttractionItem("Rừng dừa Bảy Mẫu (Thúng chai)", "4.5 km", "Xe điện / Xe máy / Taxi", "12 phút", BigDecimal.valueOf(120_000)),
                    new AttractionItem("Biển An Bàng", "4.8 km", "Xe đạp hoặc Shuttle miễn phí", "15 phút", BigDecimal.ZERO),
                    new AttractionItem("Thánh địa Mỹ Sơn", "40 km", "Xe riêng khứ hồi đón tại sảnh", "60 phút", BigDecimal.valueOf(600_000))
            );
        }
        return List.of(
                new AttractionItem("Trung tâm thành phố & Khu ẩm thực đêm", "1.5 km", "Xe điện / Taxi đặt tại quầy lễ tân", "10 phút", BigDecimal.valueOf(70_000)),
                new AttractionItem("Điểm tham quan văn hóa nổi bật", "5 - 12 km", "Xe riêng 4-7 chỗ theo lịch trình", "20 phút", BigDecimal.valueOf(250_000))
        );
    }

    private static List<AmenityCategory> buildAmenities(Hotel h) {
        List<String> basic = h.getAmenities() == null ? List.of("Wifi miễn phí", "Điều hòa")
                : List.of(h.getAmenities().split(",")).stream().map(String::trim).filter(s -> !s.isEmpty()).toList();
        return List.of(
                new AmenityCategory("Tiện nghi nổi bật tại khách sạn", basic),
                new AmenityCategory("Phòng nghỉ & Làm việc", List.of("Wifi tốc độ cao miễn phí", "Smart TV màn hình phẳng", "Bàn làm việc & ổ cắm đa năng", "Ấm đun nước & trà/cà phê miễn phí", "Két an toàn cá nhân")),
                new AmenityCategory("Ẩm thực & Thư giãn", List.of("Nhà hàng & Buffet sáng", "Phục vụ đồ ăn tại phòng 24/7", "Khu vực Lounge / Quầy bar")),
                new AmenityCategory("Di chuyển & Hỗ trợ", List.of("Đưa đón sân bay theo yêu cầu", "Hỗ trợ đặt xe đi điểm tham quan", "Gửi hành lý miễn phí", "Lễ tân hỗ trợ 24/7"))
        );
    }
}
