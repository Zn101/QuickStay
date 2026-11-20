package com.quickstay.hotel;

import jakarta.persistence.*;

@Entity
@Table(name = "hotels")
public class Hotel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String city;

    private String address;

    @Column(length = 4000)
    private String description;

    @Column(length = 1000)
    private String imageUrl;

    /** Tien nghi, cach nhau bang dau phay. */
    @Column(length = 1000)
    private String amenities;

    /** Thu vien anh: moi dong "URL|Chu thich". */
    @Column(name = "gallery", length = 4000)
    private String gallery;

    /** Gio nhan phong HH:mm. */
    @Column(name = "check_in_time", length = 5)
    private String checkInTime;

    /** Gio tra phong HH:mm. */
    @Column(name = "check_out_time", length = 5)
    private String checkOutTime;

    /** Quy dinh rieng cua co so: moi dong "Tieu de|Noi dung". */
    @Column(name = "house_rules", length = 4000)
    private String houseRules;

    @Column(name = "airport_name", length = 255)
    private String airportName;

    /** Dua don san bay: moi dong "Ten|Mau xe|So khach|Thoi gian|Gia". */
    @Column(name = "transfers", length = 2000)
    private String transfers;

    /** Am thuc tai co so: moi dong "Ten|Loai am thuc|Gio mo cua|Diem nhan|Ghi chu gia". */
    @Column(name = "dining", length = 2000)
    private String dining;

    /** Xe tham quan: moi dong "Dia diem|Khoang cach|Phuong tien|Thoi gian|Gia". */
    @Column(name = "attractions", length = 2000)
    private String attractions;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getAmenities() { return amenities; }
    public void setAmenities(String amenities) { this.amenities = amenities; }

    public String getGallery() { return gallery; }
    public void setGallery(String gallery) { this.gallery = gallery; }
    public String getCheckInTime() { return checkInTime; }
    public void setCheckInTime(String checkInTime) { this.checkInTime = checkInTime; }
    public String getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(String checkOutTime) { this.checkOutTime = checkOutTime; }
    public String getHouseRules() { return houseRules; }
    public void setHouseRules(String houseRules) { this.houseRules = houseRules; }
    public String getAirportName() { return airportName; }
    public void setAirportName(String airportName) { this.airportName = airportName; }
    public String getTransfers() { return transfers; }
    public void setTransfers(String transfers) { this.transfers = transfers; }
    public String getDining() { return dining; }
    public void setDining(String dining) { this.dining = dining; }
    public String getAttractions() { return attractions; }
    public void setAttractions(String attractions) { this.attractions = attractions; }
}
