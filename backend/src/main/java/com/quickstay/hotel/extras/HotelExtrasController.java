package com.quickstay.hotel.extras;

import com.quickstay.hotel.extras.HotelExtrasService.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class HotelExtrasController {

    private final HotelExtrasService extras;

    public HotelExtrasController(HotelExtrasService extras) {
        this.extras = extras;
    }

    @GetMapping("/hotels/{id}/extras")
    public HotelExtrasView extras(@PathVariable Long id) {
        return extras.extras(id);
    }

    @GetMapping("/hotels/{id}/reviews")
    public List<ReviewView> reviews(@PathVariable Long id) {
        return extras.reviewsOf(id);
    }

    @PostMapping("/hotels/{id}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewView addReview(@PathVariable Long id, Authentication auth, @Valid @RequestBody CreateReviewRequest req) {
        return extras.addReview(id, auth.getName(), req);
    }

    @GetMapping("/hotels/{id}/questions")
    public List<QuestionView> questions(@PathVariable Long id) {
        return extras.questionsOf(id);
    }

    @PostMapping("/hotels/{id}/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionView askQuestion(@PathVariable Long id, Authentication auth, @Valid @RequestBody CreateQuestionRequest req) {
        return extras.askQuestion(id, auth == null ? null : auth.getName(), req);
    }

    @PatchMapping("/admin/questions/{qid}")
    public QuestionView answerQuestion(@PathVariable Long qid, Authentication auth, @Valid @RequestBody AnswerQuestionRequest req) {
        return extras.answerQuestion(qid, auth.getName(), req);
    }

    @PostMapping("/hotels/{id}/concierge")
    @ResponseStatus(HttpStatus.CREATED)
    public ConciergeView createConcierge(@PathVariable Long id, Authentication auth, @Valid @RequestBody CreateConciergeRequest req) {
        return extras.createConcierge(id, auth.getName(), req);
    }

    @GetMapping("/concierge/me")
    public List<ConciergeView> myConcierge(Authentication auth) {
        return extras.myConcierge(auth.getName());
    }

    @GetMapping("/admin/concierge")
    public List<ConciergeView> allConcierge() {
        return extras.allConcierge();
    }
}
