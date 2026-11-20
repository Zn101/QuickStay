import { useSettings } from '../store/settingsStore'

export const TRANSLATIONS = {
  vi: {
    // Navigation
    nav_home: 'Trang chủ',
    nav_policies: 'Chính sách & Q&A',
    nav_my_bookings: 'Đặt phòng của tôi',
    nav_settings: 'Cài đặt',
    nav_profile: 'Hồ sơ',
    nav_admin: 'Quản trị',
    nav_inbox: 'Hộp thư',
    nav_login: 'Đăng nhập',
    nav_register: 'Đăng ký',
    nav_logout: 'Đăng xuất',
    nav_open_client: 'Mở Trang Khách Hàng (QuickStay)',
    
    // Theme & Lang
    theme_light: 'Giao diện Sáng',
    theme_dark: 'Giao diện Tối',
    lang_vi: 'Tiếng Việt',
    lang_en: 'English',
    
    // Hero & Search
    hero_title: 'Tìm & Đặt Nơi Lưu Trú Hoàn Hảo',
    hero_subtitle: 'Khách sạn, resort và homestay trên khắp Việt Nam: xem phòng trống theo ngày, giá minh bạch theo số đêm và đặt trực tuyến.',
    hero_badge: 'Đặt phòng trực tuyến khắp Việt Nam',
    search_city_label: 'Điểm đến / Thành phố',
    search_city_placeholder: 'Thành phố / Điểm đến...',
    search_checkin_label: 'Ngày nhận',
    search_checkout_label: 'Ngày trả',
    search_room_type_label: 'Hạng phòng',
    search_room_type_all: 'Tất cả loại phòng',
    search_keyword_label: 'Tìm tên khách sạn',
    search_keyword_placeholder: 'Nhập tên khách sạn...',
    search_btn: 'Tìm kiếm khách sạn',
    search_clear: 'Xóa bộ lọc',
    quick_destinations: 'Điểm đến phổ biến:',
    
    // Sections
    section_destinations: 'Điểm đến được yêu thích nhất',
    section_destinations_desc: 'Chọn điểm đến để xem các khách sạn và ưu đãi tốt nhất ngay lập tức',
    section_see_more_destinations: 'Xem thêm điểm đến ↓',
    section_see_less_destinations: 'Thu gọn điểm đến ↑',
    section_featured_hotels: 'Khách sạn & Resort nổi bật',
    section_featured_hotels_count: 'Hiển thị {count} chỗ nghỉ',
    hotels_available: '{count} khách sạn có sẵn',
    price_from: 'Từ {price}',
    price_per_night_from: 'Giá mỗi đêm từ',
    view_rooms: 'Xem phòng',
    admin_quick_edit: '⚙️ Sửa trong Admin',
    
    // Hotel Detail
    hotel_details: 'Chi tiết khách sạn',
    see_all_photos: 'Xem tất cả {count} ảnh',
    overview: 'Tổng quan',
    amenities: 'Tiện nghi nổi bật',
    room_list: 'Danh sách phòng trống',
    room_availability_check: 'Kiểm tra',
    reviews_rating: 'Đánh giá từ khách hàng',
    reviews_count: '({count} đánh giá thực tế)',
    write_review: 'Viết đánh giá của bạn',
    policies_qa: 'Chính sách & Hỏi đáp',
    checkin_time: 'Nhận phòng',
    checkout_time: 'Trả phòng',
    stay_duration: 'Thời gian lưu trú',
    nights_count: '{count} đêm',
    subtotal: 'Tạm tính ({nights} đêm):',
    login_to_book: 'Đăng nhập để đặt phòng',
    book_now: 'Đặt ngay',
    view_room_detail: 'Chi tiết phòng',
    rooms_left: 'Còn {count} phòng',
    rooms_sold_out: 'Hết phòng',
    
    // Dedicated Room Page
    room_dedicated_title: 'Chi tiết hạng phòng',
    room_specs: 'Thông số phòng',
    room_highlights: 'Đặc quyền & Tiện ích đi kèm',
    room_pricing: 'Bảng giá phòng',
    room_back_hotel: '← Quay lại thông tin khách sạn',
    room_select_dates: 'Chọn ngày lưu trú để đặt phòng này',
    room_features_title: 'Tiện nghi phòng',
    
    // Booking Form
    booking_title: 'Thông tin đặt phòng',
    booking_guest_name: 'Họ tên người nhận phòng',
    booking_guest_phone: 'Số điện thoại liên hệ',
    booking_guests_count: 'Số lượng khách',
    booking_notes: 'Yêu cầu đặc biệt (tùy chọn)',
    booking_payment_method: 'Hình thức thanh toán',
    booking_promo_label: 'Mã ưu đãi / Giảm giá',
    booking_promo_placeholder: 'Nhập mã (VD: QUICKSTAY20)...',
    booking_promo_apply: 'Áp dụng',
    booking_promo_applied: 'Đã áp dụng mã {code} (-{discount})',
    booking_promo_invalid: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
    booking_summary: 'Tóm tắt đặt phòng',
    booking_submit: 'Xác nhận đặt phòng ngay',
    booking_total: 'Tổng thanh toán',
    booking_original_price: 'Giá gốc',
    booking_discount: 'Giảm giá ưu đãi',
    
    // Ad popup & Cookie banner
    ad_badge: 'Ưu đãi đặc biệt',
    ad_title: 'Tiết kiệm 20% cho chuyến đi tới!',
    ad_desc: 'Nhập mã QUICKSTAY20 khi đặt phòng để nhận ưu đãi giảm 20% cùng bữa sáng miễn phí.',
    ad_cta: 'Khám phá ngay',
    ad_dismiss: 'Bỏ qua',
    
    cookie_title: 'Chúng tôi tôn trọng quyền riêng tư của bạn',
    cookie_desc: 'QuickStay sử dụng cookie và công nghệ liên quan để tối ưu hóa trải nghiệm tìm kiếm và đặt phòng của bạn.',
    cookie_accept: 'Chấp nhận tất cả',
    cookie_preferences: 'Tùy chọn',
    cookie_decline: 'Từ chối',
  },
  en: {
    // Navigation
    nav_home: 'Home',
    nav_policies: 'Policies & Q&A',
    nav_my_bookings: 'My Bookings',
    nav_settings: 'Settings',
    nav_profile: 'Profile',
    nav_admin: 'Admin',
    nav_inbox: 'Mailbox',
    nav_login: 'Sign In',
    nav_register: 'Sign Up',
    nav_logout: 'Sign Out',
    nav_open_client: 'Open Guest Website (QuickStay)',
    
    // Theme & Lang
    theme_light: 'Light Mode',
    theme_dark: 'Dark Mode',
    lang_vi: 'Tiếng Việt',
    lang_en: 'English',
    
    // Hero & Search
    hero_title: 'Find & Book Your Perfect Stay',
    hero_subtitle: 'Hotels, resorts and homestays across Vietnam: live availability by date, transparent nightly prices and online booking.',
    hero_badge: 'Online stays across Vietnam',
    search_city_label: 'Destination / City',
    search_city_placeholder: 'City / Destination...',
    search_checkin_label: 'Check-in',
    search_checkout_label: 'Check-out',
    search_room_type_label: 'Room Type',
    search_room_type_all: 'All Room Types',
    search_keyword_label: 'Hotel Name',
    search_keyword_placeholder: 'Enter hotel name...',
    search_btn: 'Search Hotels',
    search_clear: 'Clear Filters',
    quick_destinations: 'Popular Destinations:',
    
    // Sections
    section_destinations: 'Most Loved Destinations',
    section_destinations_desc: 'Choose your dream destination to unlock the finest properties and exclusive rates',
    section_see_more_destinations: 'See more destinations ↓',
    section_see_less_destinations: 'Collapse destinations ↑',
    section_featured_hotels: 'Featured Hotels & Resorts',
    section_featured_hotels_count: 'Showing {count} accommodations',
    hotels_available: '{count} hotels available',
    price_from: 'From {price}',
    price_per_night_from: 'Price per night from',
    view_rooms: 'View Rooms',
    admin_quick_edit: '⚙️ Edit in Admin',
    
    // Hotel Detail
    hotel_details: 'Hotel Details',
    see_all_photos: 'View all {count} photos',
    overview: 'Overview',
    amenities: 'Highlights & Amenities',
    room_list: 'Available Rooms',
    room_availability_check: 'Check',
    reviews_rating: 'Guest Reviews & Ratings',
    reviews_count: '({count} verified reviews)',
    write_review: 'Write a Review',
    policies_qa: 'Policies & Q&A',
    checkin_time: 'Check-in',
    checkout_time: 'Check-out',
    stay_duration: 'Duration of stay',
    nights_count: '{count} nights',
    subtotal: 'Subtotal ({nights} nights):',
    login_to_book: 'Sign in to Book',
    book_now: 'Book Now',
    view_room_detail: 'Room Details',
    rooms_left: '{count} rooms left',
    rooms_sold_out: 'Sold Out',
    
    // Dedicated Room Page
    room_dedicated_title: 'Room Type Details',
    room_specs: 'Room Specifications',
    room_highlights: 'Room Privileges & Amenities',
    room_pricing: 'Room Rates',
    room_back_hotel: '← Back to Hotel Details',
    room_select_dates: 'Select stay dates to book this room',
    room_features_title: 'Room amenities',
    
    // Booking Form
    booking_title: 'Booking Information',
    booking_guest_name: 'Lead Guest Full Name',
    booking_guest_phone: 'Contact Phone Number',
    booking_guests_count: 'Number of Guests',
    booking_notes: 'Special Requests (Optional)',
    booking_payment_method: 'Payment Method',
    booking_promo_label: 'Promo / Voucher Code',
    booking_promo_placeholder: 'Enter promo code (e.g. QUICKSTAY20)...',
    booking_promo_apply: 'Apply',
    booking_promo_applied: 'Promo code {code} applied (-{discount})',
    booking_promo_invalid: 'Invalid or expired promo code.',
    booking_summary: 'Booking Summary',
    booking_submit: 'Confirm Booking Now',
    booking_total: 'Total Amount',
    booking_original_price: 'Original Price',
    booking_discount: 'Promotional Discount',
    
    // Ad popup & Cookie banner
    ad_badge: 'Special Offer',
    ad_title: 'Save 20% on Your Next Getaway!',
    ad_desc: 'Use promo code QUICKSTAY20 at checkout for an instant 20% discount and complimentary breakfast.',
    ad_cta: 'Explore Now',
    ad_dismiss: 'Dismiss',
    
    cookie_title: 'We Value Your Privacy',
    cookie_desc: 'QuickStay uses cookies and relevant technologies to ensure you get the best browsing and booking experience.',
    cookie_accept: 'Accept All',
    cookie_preferences: 'Preferences',
    cookie_decline: 'Decline',
  },
}

export function useTranslation() {
  const { preferredLanguage, setLanguage } = useSettings()
  const lang = preferredLanguage === 'en' ? 'en' : 'vi'
  
  function t(key, params = {}) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.vi
    let str = dict[key] || TRANSLATIONS.vi[key] || key
    if (params) {
      Object.keys(params).forEach((k) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k])
      })
    }
    return str
  }

  return { t, lang, setLanguage, isEnglish: lang === 'en' }
}
