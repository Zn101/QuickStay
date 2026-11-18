import { useState } from 'react'
import { Link } from 'react-router-dom'

const POLICY_SECTIONS = [
  {
    title: '1. Chính sách Đặt phòng & Nhận/Trả phòng',
    items: [
      'Giờ nhận phòng tiêu chuẩn: từ 14:00. Giờ trả phòng tiêu chuẩn: trước 12:00 trưa.',
      'Khách hàng cần xuất trình CCCD/Hộ chiếu bản gốc hoặc VNeID mức 2 khi làm thủ tục nhận phòng.',
      'Yêu cầu nhận phòng sớm hoặc trả phòng muộn phụ thuộc vào tình trạng phòng thực tế và có thể áp dụng phụ phí.',
      'Toàn bộ hệ thống sử dụng khóa giao dịch bi quan (Pessimistic Lock) đảm bảo không bao giờ xảy ra tình trạng đặt trùng phòng.',
    ],
  },
  {
    title: '2. Chính sách Hủy phòng & Hoàn tiền',
    items: [
      'Miễn phí hủy đơn đối với mọi đơn đặt phòng đang ở trạng thái Chờ xác nhận (PENDING).',
      'Đối với các đơn đã thanh toán trực tuyến qua VietQR, Thẻ quốc tế hoặc Ví điện tử, khi hủy hợp lệ hệ thống tự động chuyển trạng thái thanh toán sang ĐÃ HOÀN TIỀN (REFUNDED) và gửi email xác nhận biên lai hoàn tiền.',
      'Đơn đã được quản lý xác nhận (CONFIRMED) hoặc đã nhận phòng cần liên hệ trực tiếp quầy lễ tân khách sạn để được hỗ trợ điều chỉnh.',
    ],
  },
  {
    title: '3. Chính sách Thanh toán & Bảo mật thông tin',
    items: [
      'QuickStay hỗ trợ 4 phương thức thanh toán: Thanh toán tại khách sạn, Chuyển khoản VietQR 24/7, Thẻ Visa/Mastercard và Ví MoMo/VNPay.',
      'Mật khẩu người dùng được mã hóa bằng thuật toán BCrypt; phiên đăng nhập bảo vệ bởi JWT stateless và kết nối HTTPS mã hóa SSL/TLS.',
      'Người dùng có thể bật/tắt nhận email thông báo hoặc thay đổi ngôn ngữ/tiền tệ hiển thị tại mục Cài đặt tài khoản.',
    ],
  },
  {
    title: '4. Dịch vụ Đưa đón sân bay, Ẩm thực & Tham quan',
    items: [
      'Khách lưu trú có thể đặt trước dịch vụ xe đưa đón sân bay, đặt bàn nhà hàng hoặc yêu cầu xe hỗ trợ tham quan các địa điểm du lịch nổi tiếng ngay tại trang chi tiết khách sạn.',
      'Mọi yêu cầu dịch vụ đều được gửi email xác nhận lịch trình chi tiết.',
    ],
  },
]

const FAQS = [
  {
    q: 'Tôi có cần thanh toán trước khi đặt phòng không?',
    a: 'Không bắt buộc. Bạn có thể chọn "Thanh toán tại khách sạn" để trả tiền khi nhận phòng, hoặc chọn thanh toán trực tuyến ngay qua VietQR/Thẻ/Ví điện tử để nhận biên lai điện tử.',
  },
  {
    q: 'Làm sao để xác thực email hoặc khôi phục mật khẩu khi quên?',
    a: 'Sau khi đăng ký, hệ thống tự động gửi email chứa liên kết xác thực (bạn có thể kiểm tra ngay trong nút "Hộp thư" trên thanh điều hướng). Nếu quên mật khẩu, chọn "Quên mật khẩu?" ở trang Đăng nhập.',
  },
  {
    q: 'Tôi đặt xe đón sân bay vào ban đêm có được hỗ trợ không?',
    a: 'Có. Đội ngũ tài xế và lễ tân 24/7 theo dõi mã chuyến bay bạn cung cấp để đón đúng giờ, kể cả chuyến bay hạ cánh muộn hoặc sáng sớm.',
  },
  {
    q: 'Trẻ em đi cùng có bị tính thêm phụ phí không?',
    a: 'Mỗi phòng miễn phí tối đa 1 trẻ em dưới 6 tuổi ngủ chung giường với bố mẹ. Vui lòng chọn đúng tổng số khách khi đặt phòng.',
  },
]

export default function Policies() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 p-8 text-white shadow-xl">
        <span className="inline-flex rounded-full bg-sky-500/20 px-3 py-1 text-xs font-bold text-sky-300">
          Trung tâm Hỗ trợ & Quy định
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Chính sách & Câu hỏi thường gặp (Q&A)</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Tìm hiểu đầy đủ quy định lưu trú, hoàn hủy phòng, bảo mật tài khoản và các dịch vụ hỗ trợ du lịch tại QuickStay.
        </p>
      </div>

      <div className="space-y-6">
        {POLICY_SECTIONS.map((sec) => (
          <section key={sec.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900">{sec.title}</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {sec.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-extrabold text-slate-900">Câu hỏi thường gặp (Q&A)</h2>
        <div className="divide-y divide-slate-100">
          {FAQS.map((item, idx) => {
            const isOpen = openFaq === idx
            return (
              <div key={item.q} className="py-3.5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  className="flex w-full items-center justify-between gap-4 text-left text-sm font-bold text-slate-900 hover:text-sky-600"
                >
                  <span>{item.q}</span>
                  <span className="text-lg text-slate-400">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>}
              </div>
            )
          })}
        </div>
      </section>

      <div className="mt-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-sky-700"
        >
          ← Quay lại tìm kiếm khách sạn
        </Link>
      </div>
    </div>
  )
}
