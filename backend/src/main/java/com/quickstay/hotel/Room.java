package com.quickstay.hotel;

import jakarta.persistence.*;

import java.math.BigDecimal;

/** Mot loai phong cua khach san (khong phai mot phong vat ly), co quantity phong cung loai. */
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;

    @Column(nullable = false)
    private String roomType;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal pricePerNight;

    /** So khach toi da moi phong. */
    @Column(nullable = false)
    private int capacity = 2;

    /** So phong cung loai hien co. */
    @Column(nullable = false)
    private int quantity = 1;

    @Column(length = 2000)
    private String description;

    public Long getId() { return id; }
    public Hotel getHotel() { return hotel; }
    public void setHotel(Hotel hotel) { this.hotel = hotel; }
    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }
    public BigDecimal getPricePerNight() { return pricePerNight; }
    public void setPricePerNight(BigDecimal pricePerNight) { this.pricePerNight = pricePerNight; }
    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
