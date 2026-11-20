package com.quickstay.booking;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    /**
     * Lich su dat phong cua mot nguoi dung (T101): moi nhat truoc, trung created_at thi theo id.
     * Lay kem phong va khach san trong cung truy van de dung BookingView khong phat sinh N+1.
     */
    String MINE_QUERY = """
            select b from Booking b
            join fetch b.room r
            join fetch r.hotel
            join fetch b.user u
            where u.id = :userId
            order by b.createdAt desc, b.id desc
            """;

    @Query(MINE_QUERY)
    List<Booking> findMine(@Param("userId") Long userId);

    /** Ban phan trang cua findMine (T165); chi join to-one nen LIMIT chay trong SQL. */
    @Query(value = MINE_QUERY, countQuery = "select count(b) from Booking b where b.user.id = :userId")
    Page<Booking> findMine(@Param("userId") Long userId, Pageable pageable);

    /** So don chua huy chong lan [checkIn, checkOut) cua mot loai phong; cung dieu kien voi countOverlappingByHotel. */
    @Query("""
            select count(b) from Booking b
            where b.room.id = :roomId
              and b.checkIn < :checkOut
              and b.checkOut > :checkIn
              and b.status <> com.quickstay.booking.BookingStatus.CANCELLED
            """)
    long countOverlapping(@Param("roomId") Long roomId,
                          @Param("checkIn") LocalDate checkIn,
                          @Param("checkOut") LocalDate checkOut);

    /** Danh sach toan bo don cho admin, moi nhat truoc; trung created_at thi theo id de thu tu on dinh. */
    @EntityGraph(attributePaths = {"user", "room", "room.hotel"})
    List<Booking> findAllByOrderByCreatedAtDescIdDesc();

    @EntityGraph(attributePaths = {"user", "room", "room.hotel"})
    Page<Booking> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);

    /** Don dat phong thuoc khach san / homestay cua doi tac (HOTEL_MANAGER). */
    @EntityGraph(attributePaths = {"user", "room", "room.hotel"})
    @Query("select b from Booking b where b.room.hotel.id = :hotelId order by b.createdAt desc, b.id desc")
    List<Booking> findByHotelId(@Param("hotelId") Long hotelId);

    @EntityGraph(attributePaths = {"user", "room", "room.hotel"})
    @Query(value = "select b from Booking b where b.room.hotel.id = :hotelId order by b.createdAt desc, b.id desc",
           countQuery = "select count(b) from Booking b where b.room.hotel.id = :hotelId")
    Page<Booking> findByHotelId(@Param("hotelId") Long hotelId, Pageable pageable);

    /**
     * Doc don va khoa dong do toi het transaction (T112): khach huy va admin doi trang thai cung luc
     * phai xep hang, nguoi sau thay trang thai moi nhat thay vi ghi de len nguoi truoc.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") Long id);

    /**
     * So don chua huy chong lan [checkIn, checkOut) cua tung loai phong trong khach san, trong MOT truy van (T077).
     * Chong lan khi b.checkIn < checkOut va b.checkOut > checkIn: bat dang thuc chat nen hai ky nghi
     * lien ke (ngay tra cua don nay = ngay nhan cua don kia) khong xung dot.
     * Loai phong khong co don nao chong lan thi khong co trong ket qua.
     */
    @Query("""
            select new com.quickstay.booking.RoomBookedCount(b.room.id, count(b))
            from Booking b
            where b.room.hotel.id = :hotelId
              and b.checkIn < :checkOut
              and b.checkOut > :checkIn
              and b.status <> com.quickstay.booking.BookingStatus.CANCELLED
            group by b.room.id
            """)
    List<RoomBookedCount> countOverlappingByHotel(@Param("hotelId") Long hotelId,
                                                  @Param("checkIn") LocalDate checkIn,
                                                  @Param("checkOut") LocalDate checkOut);

    /**
     * So don chua huy chong lan [checkIn, checkOut) cua tung loai phong tren DANH SACH nhieu khach san (batch).
     * Giai quyet dut diem van de N+1 truy van khi loc phong trong tren ket qua tim kiem.
     */
    @Query("""
            select new com.quickstay.booking.RoomBookedCount(b.room.id, count(b))
            from Booking b
            where b.room.hotel.id in :hotelIds
              and b.checkIn < :checkOut
              and b.checkOut > :checkIn
              and b.status <> com.quickstay.booking.BookingStatus.CANCELLED
            group by b.room.id
            """)
    List<RoomBookedCount> countOverlappingByHotels(@Param("hotelIds") Collection<Long> hotelIds,
                                                   @Param("checkIn") LocalDate checkIn,
                                                   @Param("checkOut") LocalDate checkOut);

    /** Dem tong so don dat phong theo trang thai cu the (tranh load entity vao bo nho). */
    long countByStatus(BookingStatus status);

    /** Tinh tong doanh thu thuc te (CONFIRMED, CHECKED_IN, COMPLETED) truc tiep bang ham SUM trong SQL. */
    @Query("""
            select coalesce(sum(b.totalPrice), 0)
            from Booking b
            where b.status in (com.quickstay.booking.BookingStatus.CONFIRMED,
                               com.quickstay.booking.BookingStatus.CHECKED_IN,
                               com.quickstay.booking.BookingStatus.COMPLETED)
            """)
    java.math.BigDecimal sumConfirmedRevenue();

    /** Lay top cac loai phong duoc dat nhieu nhat bang GROUP BY va ORDER BY truc tiep tren DB. */
    @Query("""
            select b.room.roomType, count(b)
            from Booking b
            group by b.room.roomType
            order by count(b) desc
            """)
    List<Object[]> findTopBookedRoomTypes(Pageable pageable);

    /**
     * Kiem tra xem loai phong co bat ky don dat phong nao khong (moi trang thai).
     * bookings.room_id NOT NULL nen khong the xoa Room khi con Booking, ke ca CANCELLED.
     * Goi tu RoomAdminService.delete() (T095).
     */
    boolean existsByRoomId(Long roomId);

    /** Khach da tung luu tru (theo trang thai) tai khach san: dieu kien de danh gia. */
    boolean existsByUserIdAndRoomHotelIdAndStatusIn(Long userId, Long hotelId, Collection<BookingStatus> statuses);

    /** Don con hieu luc (chua huy / chua hoan tat) chua tra phong cua mot loai phong: dung de tinh dinh so phong dang dung. */
    @Query("""
            select b from Booking b
            where b.room.id = :roomId
              and b.checkOut > :today
              and b.status in (com.quickstay.booking.BookingStatus.PENDING,
                               com.quickstay.booking.BookingStatus.CONFIRMED,
                               com.quickstay.booking.BookingStatus.CHECKED_IN)
            """)
    List<Booking> findActiveUpcomingByRoom(@Param("roomId") Long roomId, @Param("today") LocalDate today);

    /** Don chua huy cua mot khach san chong lan [from, to): du lieu cho lich phong cua doi tac. */
    @EntityGraph(attributePaths = {"room"})
    @Query("""
            select b from Booking b
            where b.room.hotel.id = :hotelId
              and b.checkIn < :to
              and b.checkOut > :from
              and b.status <> com.quickstay.booking.BookingStatus.CANCELLED
            """)
    List<Booking> findOccupyingByHotel(@Param("hotelId") Long hotelId,
                                       @Param("from") LocalDate from,
                                       @Param("to") LocalDate to);

    /**
     * Kiem tra xem khach san co don dat phong o cac trang thai cho truoc khong.
     * Dung de bao ve khach san khoi bi xoa khi con Booking tham chieu Room (FK NOT NULL).
     * Goi tu HotelAdminService.delete() (T083).
     */
    boolean existsByRoomHotelIdAndStatusIn(Long hotelId, Collection<BookingStatus> statuses);
}
