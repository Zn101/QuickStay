package com.quickstay.hotel.extras;

import com.quickstay.hotel.Hotel;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "concierge_requests")
public class ConciergeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;

    private Long userId;

    @Column(nullable = false)
    private String guestName;

    @Column(nullable = false)
    private String guestEmail;

    @Column(nullable = false, length = 50)
    private String guestPhone;

    @Column(nullable = false, length = 30)
    private String serviceType;

    @Column(nullable = false)
    private String serviceTitle;

    @Column(nullable = false)
    private LocalDate serviceDate;

    @Column(length = 20)
    private String serviceTime;

    @Column(nullable = false)
    private int guests = 1;

    @Column(length = 1000)
    private String details;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal estimatedFee = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String status = "CONFIRMED";

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public Long getId() { return id; }
    public Hotel getHotel() { return hotel; }
    public void setHotel(Hotel hotel) { this.hotel = hotel; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }
    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }
    public String getGuestPhone() { return guestPhone; }
    public void setGuestPhone(String guestPhone) { this.guestPhone = guestPhone; }
    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }
    public String getServiceTitle() { return serviceTitle; }
    public void setServiceTitle(String serviceTitle) { this.serviceTitle = serviceTitle; }
    public LocalDate getServiceDate() { return serviceDate; }
    public void setServiceDate(LocalDate serviceDate) { this.serviceDate = serviceDate; }
    public String getServiceTime() { return serviceTime; }
    public void setServiceTime(String serviceTime) { this.serviceTime = serviceTime; }
    public int getGuests() { return guests; }
    public void setGuests(int guests) { this.guests = guests; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public BigDecimal getEstimatedFee() { return estimatedFee; }
    public void setEstimatedFee(BigDecimal estimatedFee) { this.estimatedFee = estimatedFee; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
}
