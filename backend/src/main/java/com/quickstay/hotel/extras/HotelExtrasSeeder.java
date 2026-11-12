package com.quickstay.hotel.extras;

import com.quickstay.hotel.Hotel;
import com.quickstay.hotel.HotelRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Seed danh gia & Q&A mau cho cac khach san khi bang hotel_reviews con trong. */
@Component
@Order(3)
@ConditionalOnProperty(name = "app.seed.sample-data", havingValue = "true", matchIfMissing = true)
public class HotelExtrasSeeder implements ApplicationRunner {

    private final HotelRepository hotels;
    private final HotelReviewRepository reviews;
    private final HotelQuestionRepository questions;

    public HotelExtrasSeeder(HotelRepository hotels, HotelReviewRepository reviews, HotelQuestionRepository questions) {
        this.hotels = hotels;
        this.reviews = reviews;
        this.questions = questions;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (reviews.count() > 0) {
            return;
        }
        List<Hotel> all = hotels.findAll();
        for (Hotel h : all) {
            saveReview(h, "Nguyễn Minh Anh", 5, "Phòng sạch sẽ, nhân viên lễ tân hỗ trợ đặt xe đón sân bay rất đúng giờ. Buffet sáng đa dạng và ngon miệng.", "Gia đình");
            saveReview(h, "Trần Hoàng Nam", 5, "Vị trí cực kỳ thuận tiện đi lại các điểm tham quan, wifi mạnh làm việc từ xa thoải mái.", "Công tác");
            saveReview(h, "Lê Thảo Vy", 4, "Không gian yên tĩnh, giường êm và view đẹp. Sẽ quay lại vào kỳ nghỉ tới.", "Cặp đôi");

            saveQuestion(h, "Phạm Quốc Bảo", "Khách sạn có hỗ trợ giữ hành lý nếu tôi đến sớm trước 14:00 không?",
                    "Dạ có ạ! Lễ tân phục vụ 24/7 và giữ hành lý hoàn toàn miễn phí trước giờ nhận phòng và sau giờ trả phòng.", "Quản lý " + h.getName());
            saveQuestion(h, "Đỗ Lan Hương", "Tôi có thể đặt xe đưa đón từ sân bay về khách sạn vào chuyến bay tối muộn không?",
                    "Hoàn toàn được ạ. Bạn có thể đặt trực tiếp tại mục Dịch vụ đưa đón sân bay ngay trên trang khách sạn, tài xế sẽ theo dõi giờ hạ cánh để đón đúng giờ.", "Quản lý " + h.getName());
        }
    }

    private void saveReview(Hotel h, String author, int rating, String comment, String stayType) {
        HotelReview r = new HotelReview();
        r.setHotel(h);
        r.setAuthorName(author);
        r.setRating(rating);
        r.setComment(comment);
        r.setStayType(stayType);
        reviews.save(r);
    }

    private void saveQuestion(Hotel h, String author, String qText, String aText, String answeredBy) {
        HotelQuestion q = new HotelQuestion();
        q.setHotel(h);
        q.setAuthorName(author);
        q.setQuestion(qText);
        q.setAnswer(aText);
        q.setAnsweredBy(answeredBy);
        questions.save(q);
    }
}
