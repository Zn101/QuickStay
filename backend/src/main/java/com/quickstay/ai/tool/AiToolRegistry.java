package com.quickstay.ai.tool;

import com.quickstay.ai.model.ToolCallRequest;
import com.quickstay.ai.model.ToolCallResult;
import com.quickstay.ai.model.ToolDefinition;
import com.quickstay.booking.Booking;
import com.quickstay.booking.BookingRepository;
import com.quickstay.booking.BookingStatus;
import com.quickstay.hotel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.text.NumberFormat;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Registry quản lý và thực thi danh sách Tool gọi hàm (Function / Tool Calling).
 * Tuân thủ nghiêm ngặt nguyên tắc: READ-ONLY BY DEFAULT.
 * Khách và Model KHÔNG THỂ tự động tạo hay hủy đơn đặt phòng qua công cụ.
 */
@Component
public class AiToolRegistry {

    private static final Logger log = LoggerFactory.getLogger(AiToolRegistry.class);
    private static final NumberFormat VND = NumberFormat.getInstance(new Locale("vi", "VN"));

    private final HotelRepository hotels;
    private final RoomRepository rooms;
    private final BookingRepository bookings;
    private final Map<String, AiTool> toolMap = new ConcurrentHashMap<>();

    public AiToolRegistry(HotelRepository hotels, RoomRepository rooms, BookingRepository bookings) {
        this.hotels = hotels;
        this.rooms = rooms;
        this.bookings = bookings;
        registerTools();
    }

    private void registerTools() {
        // Tool 1: search_rooms
        register(new AiTool() {
            @Override
            public ToolDefinition getDefinition() {
                Map<String, Object> props = new LinkedHashMap<>();
                props.put("city", Map.of("type", "string", "description", "Thành phố hoặc địa điểm (ví dụ: Đà Nẵng, Hà Nội, Hội An, Phú Quốc, Nha Trang, Đà Lạt, Huế)"));
                props.put("checkIn", Map.of("type", "string", "description", "Ngày nhận phòng định dạng YYYY-MM-DD"));
                props.put("checkOut", Map.of("type", "string", "description", "Ngày trả phòng định dạng YYYY-MM-DD"));
                props.put("guests", Map.of("type", "integer", "description", "Số lượng khách lưu trú"));
                props.put("maxPrice", Map.of("type", "number", "description", "Mức giá trần mỗi đêm (VND)"));
                props.put("amenities", Map.of("type", "string", "description", "Tiện nghi mong muốn (Hồ bơi, Gần biển, Ăn sáng, v.v.)"));

                Map<String, Object> schema = Map.of(
                        "type", "object",
                        "properties", props
                );
                return ToolDefinition.of("search_rooms", "Tìm kiếm phòng và khách sạn theo địa điểm, ngày lưu trú, số khách và ngân sách với giá thực và phòng trống trực tiếp.", schema);
            }

            @Override
            public ToolCallResult execute(String toolCallId, Map<String, Object> args) {
                try {
                    String city = (String) args.get("city");
                    String checkInStr = (String) args.get("checkIn");
                    String checkOutStr = (String) args.get("checkOut");
                    Integer guests = args.get("guests") != null ? ((Number) args.get("guests")).intValue() : 1;
                    BigDecimal maxPrice = args.get("maxPrice") != null ? new BigDecimal(String.valueOf(args.get("maxPrice"))) : null;
                    String amenities = (String) args.get("amenities");

                    LocalDate in = parseDate(checkInStr);
                    LocalDate out = parseDate(checkOutStr);
                    if (in == null) in = LocalDate.now().plusDays(1);
                    if (out == null || !out.isAfter(in)) out = in.plusDays(1);

                    List<Hotel> hotelList = hotels.findAll();
                    String cityNormalized = stripAccents(city);

                    List<Map<String, Object>> matchedRooms = new ArrayList<>();

                    for (Hotel h : hotelList) {
                        if (cityNormalized != null && !cityNormalized.isBlank()) {
                            if (!stripAccents(h.getCity()).contains(cityNormalized) && !stripAccents(h.getName()).contains(cityNormalized)) {
                                continue;
                            }
                        }
                        if (amenities != null && !amenities.isBlank()) {
                            if (h.getAmenities() == null || !stripAccents(h.getAmenities()).contains(stripAccents(amenities))) {
                                continue;
                            }
                        }

                        List<Room> rList = rooms.findByHotelIdOrderByPricePerNightAscIdAsc(h.getId());
                        for (Room r : rList) {
                            if (guests != null && r.getCapacity() < guests) continue;
                            if (maxPrice != null && r.getPricePerNight().compareTo(maxPrice) > 0) continue;

                            long booked = bookings.countOverlapping(r.getId(), in, out);
                            long available = Math.max(0, r.getQuantity() - booked);

                            if (available > 0) {
                                Map<String, Object> item = new LinkedHashMap<>();
                                item.put("hotelId", h.getId());
                                item.put("hotelName", h.getName());
                                item.put("city", h.getCity());
                                item.put("roomId", r.getId());
                                item.put("roomType", r.getRoomType());
                                item.put("capacity", r.getCapacity());
                                item.put("pricePerNight", r.getPricePerNight());
                                item.put("priceFormatted", VND.format(r.getPricePerNight()) + " VND");
                                item.put("availableRooms", available);
                                item.put("checkIn", in.toString());
                                item.put("checkOut", out.toString());
                                matchedRooms.add(item);
                            }
                        }
                    }

                    return ToolCallResult.ok(toolCallId, "search_rooms", matchedRooms);
                } catch (Exception e) {
                    log.error("Lỗi khi chạy tool search_rooms: {}", e.getMessage());
                    return ToolCallResult.error(toolCallId, "search_rooms", e.getMessage());
                }
            }
        });

        // Tool 2: check_availability
        register(new AiTool() {
            @Override
            public ToolDefinition getDefinition() {
                Map<String, Object> props = new LinkedHashMap<>();
                props.put("hotelId", Map.of("type", "integer", "description", "Mã ID của khách sạn"));
                props.put("checkIn", Map.of("type", "string", "description", "Ngày nhận phòng YYYY-MM-DD"));
                props.put("checkOut", Map.of("type", "string", "description", "Ngày trả phòng YYYY-MM-DD"));
                props.put("guests", Map.of("type", "integer", "description", "Số lượng khách"));

                Map<String, Object> schema = Map.of(
                        "type", "object",
                        "properties", props,
                        "required", List.of("hotelId")
                );
                return ToolDefinition.of("check_availability", "Kiểm tra tình trạng phòng trống thực tế theo thời gian thực của một khách sạn cụ thể.", schema);
            }

            @Override
            public ToolCallResult execute(String toolCallId, Map<String, Object> args) {
                try {
                    Long hotelId = ((Number) args.get("hotelId")).longValue();
                    LocalDate in = parseDate((String) args.get("checkIn"));
                    LocalDate out = parseDate((String) args.get("checkOut"));
                    if (in == null) in = LocalDate.now().plusDays(1);
                    if (out == null || !out.isAfter(in)) out = in.plusDays(1);

                    Hotel h = hotels.findById(hotelId).orElse(null);
                    if (h == null) return ToolCallResult.error(toolCallId, "check_availability", "Không tìm thấy khách sạn ID: " + hotelId);

                    List<Room> rList = rooms.findByHotelIdOrderByPricePerNightAscIdAsc(hotelId);
                    List<Map<String, Object>> result = new ArrayList<>();
                    for (Room r : rList) {
                        long booked = bookings.countOverlapping(r.getId(), in, out);
                        long available = Math.max(0, r.getQuantity() - booked);
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("roomId", r.getId());
                        row.put("roomType", r.getRoomType());
                        row.put("capacity", r.getCapacity());
                        row.put("totalQuantity", r.getQuantity());
                        row.put("available", available);
                        row.put("pricePerNight", r.getPricePerNight());
                        row.put("isAvailable", available > 0);
                        result.add(row);
                    }

                    return ToolCallResult.ok(toolCallId, "check_availability", Map.of(
                            "hotelName", h.getName(),
                            "checkIn", in.toString(),
                            "checkOut", out.toString(),
                            "rooms", result
                    ));
                } catch (Exception e) {
                    return ToolCallResult.error(toolCallId, "check_availability", e.getMessage());
                }
            }
        });

        // Tool 3: get_hotel_info
        register(new AiTool() {
            @Override
            public ToolDefinition getDefinition() {
                Map<String, Object> props = Map.of(
                        "hotelNameOrId", Map.of("type", "string", "description", "Tên khách sạn hoặc mã ID của khách sạn")
                );
                return ToolDefinition.of("get_hotel_info", "Truy vấn thông tin chi tiết, địa chỉ, tiện nghi, và các hạng phòng của một khách sạn.",
                        Map.of("type", "object", "properties", props, "required", List.of("hotelNameOrId")));
            }

            @Override
            public ToolCallResult execute(String toolCallId, Map<String, Object> args) {
                try {
                    String query = String.valueOf(args.get("hotelNameOrId"));
                    Hotel found = null;
                    if (query.matches("\\d+")) {
                        found = hotels.findById(Long.parseLong(query)).orElse(null);
                    }
                    if (found == null) {
                        String qNorm = stripAccents(query);
                        found = hotels.findAll().stream()
                                .filter(h -> stripAccents(h.getName()).contains(qNorm) || qNorm.contains(stripAccents(h.getName())))
                                .findFirst().orElse(null);
                    }

                    if (found == null) {
                        return ToolCallResult.error(toolCallId, "get_hotel_info", "Không tìm thấy cơ sở lưu trú: " + query);
                    }

                    List<Room> rList = rooms.findByHotelIdOrderByPricePerNightAscIdAsc(found.getId());
                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("id", found.getId());
                    data.put("name", found.getName());
                    data.put("city", found.getCity());
                    data.put("address", found.getAddress());
                    data.put("description", found.getDescription());
                    data.put("amenities", found.getAmenities());
                    data.put("roomCount", rList.size());
                    data.put("roomTypes", rList.stream().map(r -> r.getRoomType() + " (" + VND.format(r.getPricePerNight()) + " VND/đêm, " + r.getCapacity() + " khách)").toList());

                    return ToolCallResult.ok(toolCallId, "get_hotel_info", data);
                } catch (Exception e) {
                    return ToolCallResult.error(toolCallId, "get_hotel_info", e.getMessage());
                }
            }
        });

        // Tool 4: get_admin_insights (Crucial: Fixed reporting tools, NOT raw SQL)
        register(new AiTool() {
            @Override
            public ToolDefinition getDefinition() {
                Map<String, Object> props = Map.of(
                        "metric", Map.of("type", "string", "description", "Chỉ số cần báo cáo: CANCELLATIONS (tỷ lệ và số lượng hủy), REVENUE (doanh thu hàng đầu), OCCUPANCY (công suất phòng)"),
                        "month", Map.of("type", "integer", "description", "Tháng (1-12, tùy chọn)"),
                        "year", Map.of("type", "integer", "description", "Năm (ví dụ 2026)")
                );
                return ToolDefinition.of("get_admin_insights", "Công cụ báo cáo thống kê cố định dành cho quản trị viên (tỷ lệ hủy, doanh thu, lấp đầy phòng). Nghiêm cấm sinh SQL thô.",
                        Map.of("type", "object", "properties", props, "required", List.of("metric")));
            }

            @Override
            public ToolCallResult execute(String toolCallId, Map<String, Object> args) {
                try {
                    String metric = String.valueOf(args.get("metric")).toUpperCase();
                    List<Booking> allBookings = bookings.findAll();

                    Map<String, Object> report = new LinkedHashMap<>();
                    report.put("totalBookingsAllTime", allBookings.size());

                    if (metric.contains("CANCEL")) {
                        long cancelled = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.CANCELLED).count();
                        double cancelRate = allBookings.isEmpty() ? 0 : (double) cancelled * 100 / allBookings.size();
                        report.put("metric", "CANCELLATIONS");
                        report.put("cancelledCount", cancelled);
                        report.put("cancellationRatePercent", Math.round(cancelRate * 10.0) / 10.0);
                        report.put("summary", "Tổng cộng " + cancelled + " đơn đã hủy (" + (Math.round(cancelRate * 10.0) / 10.0) + "% trên tổng số đơn).");
                    } else if (metric.contains("OCCUPANCY") || metric.contains("ROOM")) {
                        Map<String, Long> roomCounts = allBookings.stream()
                                .collect(Collectors.groupingBy(b -> b.getRoom().getRoomType(), Collectors.counting()));
                        List<Map.Entry<String, Long>> sorted = roomCounts.entrySet().stream()
                                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                                .limit(5).toList();
                        report.put("metric", "ROOM_FILL_FREQUENCY");
                        report.put("topBookedRoomTypes", sorted);
                        String fastest = sorted.isEmpty() ? "Chưa có dữ liệu" : sorted.get(0).getKey() + " (" + sorted.get(0).getValue() + " lượt đặt)";
                        report.put("fastestFillingRoomType", fastest);
                    } else { // REVENUE
                        BigDecimal totalRev = allBookings.stream()
                                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.CHECKED_IN || b.getStatus() == BookingStatus.COMPLETED)
                                .map(Booking::getTotalPrice)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                        report.put("metric", "REVENUE");
                        report.put("totalRevenueConfirmedVND", totalRev);
                        report.put("formattedRevenue", VND.format(totalRev) + " VND");
                    }

                    return ToolCallResult.ok(toolCallId, "get_admin_insights", report);
                } catch (Exception e) {
                    return ToolCallResult.error(toolCallId, "get_admin_insights", e.getMessage());
                }
            }
        });

        // Tool 5: get_pricing_stats
        register(new AiTool() {
            @Override
            public ToolDefinition getDefinition() {
                Map<String, Object> props = Map.of(
                        "hotelId", Map.of("type", "integer", "description", "Mã ID khách sạn cần phân tích thống kê giá và công suất")
                );
                return ToolDefinition.of("get_pricing_stats", "Tính toán thống kê thực tế từ dữ liệu đặt phòng (tỷ lệ đặt ngày thường vs cuối tuần, thời gian đặt trước) để AI đưa ra nhận xét giá.",
                        Map.of("type", "object", "properties", props, "required", List.of("hotelId")));
            }

            @Override
            public ToolCallResult execute(String toolCallId, Map<String, Object> args) {
                try {
                    Long hotelId = ((Number) args.get("hotelId")).longValue();
                    Hotel h = hotels.findById(hotelId).orElse(null);
                    if (h == null) return ToolCallResult.error(toolCallId, "get_pricing_stats", "Không tìm thấy khách sạn ID: " + hotelId);

                    List<Booking> hotelBookings = bookings.findByHotelId(hotelId);

                    long weekdayCount = 0;
                    long weekendCount = 0;
                    long totalLeadDays = 0;
                    long validLeadBookings = 0;

                    for (Booking b : hotelBookings) {
                        DayOfWeek dow = b.getCheckIn().getDayOfWeek();
                        if (dow == DayOfWeek.FRIDAY || dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
                            weekendCount++;
                        } else {
                            weekdayCount++;
                        }

                        if (b.getCreatedAt() != null) {
                            LocalDate bookedDate = LocalDate.ofInstant(b.getCreatedAt(), java.time.ZoneId.systemDefault());
                            long lead = ChronoUnit.DAYS.between(bookedDate, b.getCheckIn());
                            if (lead >= 0) {
                                totalLeadDays += lead;
                                validLeadBookings++;
                            }
                        }
                    }

                    double avgLeadDays = validLeadBookings > 0 ? (double) totalLeadDays / validLeadBookings : 3.0;

                    Map<String, Object> stats = new LinkedHashMap<>();
                    stats.put("hotelId", hotelId);
                    stats.put("hotelName", h.getName());
                    stats.put("totalBookingsAnalyzed", hotelBookings.size());
                    stats.put("weekdayBookings", weekdayCount);
                    stats.put("weekendBookings", weekendCount);
                    stats.put("weekendSharePercent", hotelBookings.isEmpty() ? 0 : Math.round((double) weekendCount * 100 / hotelBookings.size()));
                    stats.put("averageLeadTimeDays", Math.round(avgLeadDays * 10.0) / 10.0);

                    return ToolCallResult.ok(toolCallId, "get_pricing_stats", stats);
                } catch (Exception e) {
                    return ToolCallResult.error(toolCallId, "get_pricing_stats", e.getMessage());
                }
            }
        });
    }

    public void register(AiTool tool) {
        toolMap.put(tool.getDefinition().name(), tool);
    }

    public List<ToolDefinition> getAllDefinitions() {
        return toolMap.values().stream().map(AiTool::getDefinition).toList();
    }

    public Optional<AiTool> getTool(String name) {
        return Optional.ofNullable(toolMap.get(name));
    }

    public ToolCallResult execute(ToolCallRequest req) {
        AiTool tool = toolMap.get(req.toolName());
        if (tool == null) {
            return ToolCallResult.error(req.id(), req.toolName(), "Công cụ không tồn tại: " + req.toolName());
        }
        return tool.execute(req.id(), req.arguments() != null ? req.arguments() : Map.of());
    }

    private static LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalDate.parse(s.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private static String stripAccents(String s) {
        if (s == null) return "";
        String normalized = Normalizer.normalize(s, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "")
                .replace('đ', 'd').replace('Đ', 'D')
                .toLowerCase(Locale.ROOT);
    }
}
