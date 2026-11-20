package com.quickstay.venue;

import com.quickstay.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;

/** Tour / diem du lich o trang /tours; owner la tai khoan TOUR_OPERATOR (co the trong). */
@Entity
@Table(name = "tours")
public class Tour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String city;

    private String category;

    @Column(length = 1000)
    private String imageUrl;

    @Column(length = 100)
    private String duration;

    /** Gia moi khach. */
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    private String transport;

    /** Diem noi bat, moi dong mot y. */
    @Column(length = 1000)
    private String highlights;

    /** Lich trinh, moi dong "Gio|Hoat dong". */
    @Column(length = 2000)
    private String itinerary;

    @Column(length = 1000)
    private String includes;

    @Column(length = 1000)
    private String excludes;

    private String meetingPoint;

    /** Tong so khach toi da cua cac don chua huy trong cung mot ngay khoi hanh. */
    @Column(nullable = false)
    private int maxGuestsPerDay = 30;

    @Column(length = 4000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getTransport() { return transport; }
    public void setTransport(String transport) { this.transport = transport; }
    public String getHighlights() { return highlights; }
    public void setHighlights(String highlights) { this.highlights = highlights; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getItinerary() { return itinerary; }
    public void setItinerary(String itinerary) { this.itinerary = itinerary; }
    public String getIncludes() { return includes; }
    public void setIncludes(String includes) { this.includes = includes; }
    public String getExcludes() { return excludes; }
    public void setExcludes(String excludes) { this.excludes = excludes; }
    public String getMeetingPoint() { return meetingPoint; }
    public void setMeetingPoint(String meetingPoint) { this.meetingPoint = meetingPoint; }
    public int getMaxGuestsPerDay() { return maxGuestsPerDay; }
    public void setMaxGuestsPerDay(int maxGuestsPerDay) { this.maxGuestsPerDay = maxGuestsPerDay; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
}
