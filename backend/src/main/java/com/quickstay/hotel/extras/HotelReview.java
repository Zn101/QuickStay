package com.quickstay.hotel.extras;

import com.quickstay.hotel.Hotel;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "hotel_reviews")
public class HotelReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;

    private Long userId;

    @Column(nullable = false)
    private String authorName;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, length = 2000)
    private String comment;

    @Column(length = 50)
    private String stayType;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public Long getId() { return id; }
    public Hotel getHotel() { return hotel; }
    public void setHotel(Hotel hotel) { this.hotel = hotel; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public String getStayType() { return stayType; }
    public void setStayType(String stayType) { this.stayType = stayType; }
    public Instant getCreatedAt() { return createdAt; }
}
