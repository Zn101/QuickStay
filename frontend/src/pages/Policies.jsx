import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

/** Phiên bản chính sách: khớp AuthService.TERMS_VERSION ở backend (lưu kèm khi khách đồng ý lúc đăng ký). */
export const POLICY_VERSION = '2026-11-20'

/**
 * Mỗi quy định dưới đây khớp với hành vi thật của hệ thống (BookingService, VenueService, HotelExtrasService...).
 * Sửa logic nghiệp vụ thì phải sửa văn bản tương ứng và tăng POLICY_VERSION.
 */
const POLICY_SECTIONS = [
  {
    id: 'dieu-khoan',
    title: '1. Điều khoản sử dụng',
    items: [
      'QuickStay là nền tảng trung gian kết nối khách với khách sạn, homestay, nhà hàng và đơn vị tour (gọi chung là đối tác). Hợp đồng lưu trú / dịch vụ được thực hiện giữa khách và đối tác.',
      'Người đăng ký tài khoản cần đủ 18 tuổi (hoặc có sự đồng ý của cha mẹ / người giám hộ), cung cấp họ tên, email và số điện thoại chính xác. Mỗi người chỉ dùng một tài khoản và tự bảo mật mật khẩu của mình.',
      'Thông tin cơ sở (ảnh, mô tả, tiện nghi, giá, quy định riêng) do đối tác tự đăng và chịu trách nhiệm về độ chính xác. Nếu thông tin sai lệch so với thực tế, vui lòng báo cho QuickStay qua email hỗ trợ.',
      'Không dùng QuickStay để đặt đơn ảo, giữ chỗ hàng loạt, đăng nội dung xúc phạm, quảng cáo hoặc thông tin cá nhân của người khác. QuickStay có thể khoá tài khoản vi phạm.',
    ],
  },
  {
    id: 'dat-phong',
    title: '2. Đặt phòng',
    items: [
      'Bạn cần xác thực email trước khi đặt phòng, đặt bàn, đặt tour, gửi yêu cầu dịch vụ hoặc viết đánh giá.',
      'Mỗi đơn đặt tối đa 30 đêm và nhận phòng trong vòng 365 ngày tới. Số khách (kể cả trẻ em) không vượt quá sức chứa của loại phòng.',
      'Tổng tiền = giá mỗi đêm × số đêm, tính tại thời điểm đặt. QuickStay không thu phí đặt phòng và hiện không áp dụng mã giảm giá.',
      'Đơn mới ở trạng thái Chờ xác nhận; cơ sở xác nhận, ghi nhận nhận phòng và hoàn tất đơn. Mọi thay đổi trạng thái đều được gửi email thông báo.',
      'Giờ nhận / trả phòng và quy định riêng (giấy tờ, trẻ em, giường phụ, hút thuốc...) do từng cơ sở công bố trên trang chi tiết. Nếu cơ sở chưa công bố: nhận phòng từ 14:00, trả phòng trước 12:00.',
      'Hệ thống khoá dữ liệu khi tạo đơn nên một phòng không bị bán trùng; nếu phòng vừa hết, bạn sẽ được báo ngay khi đặt.',
    ],
  },
  {
    id: 'huy-phong',
    title: '3. Hủy phòng & Hoàn tiền',
    items: [
      'Khách tự hủy miễn phí trên QuickStay (mục Đơn đặt phòng) đến hết ngày trước ngày nhận phòng, áp dụng cho đơn Chờ xác nhận và Đã xác nhận.',
      'Từ ngày nhận phòng trở đi không hủy trực tuyến được; vui lòng liên hệ trực tiếp cơ sở. Không đến nhận phòng (no-show) không được hoàn tiền tự động.',
      'Đơn đã thanh toán trực tuyến khi bị hủy hợp lệ (do khách hoặc do cơ sở) được hoàn 100% và chuyển sang trạng thái Đã hoàn tiền.',
      'Đặt bàn nhà hàng và đặt tour: hủy được khi đơn còn Chờ xác nhận hoặc Đã xác nhận và chưa tới ngày sử dụng dịch vụ.',
      'Dịch vụ đưa đón, xe tham quan đặt qua trang khách sạn: phí theo bảng giá cơ sở công bố, thanh toán trực tiếp với cơ sở; muốn đổi / hủy vui lòng liên hệ cơ sở.',
    ],
  },
  {
    id: 'thanh-toan',
    title: '4. Thanh toán',
    items: [
      'Bạn có thể chọn thanh toán tại cơ sở khi nhận phòng, hoặc thanh toán trực tuyến bằng thẻ, chuyển khoản VietQR hay ví điện tử sau khi đặt.',
      'Cổng thanh toán trực tuyến hiện chạy ở chế độ thử nghiệm: không trừ tiền thật, biên lai và hoàn tiền chỉ là cập nhật trạng thái trên hệ thống.',
      'QuickStay không lưu số thẻ đầy đủ; đơn chỉ ghi nhận phương thức và nhãn tài khoản rút gọn (ví dụ **** 4242).',
    ],
  },
  {
    id: 'danh-gia',
    title: '5. Đánh giá & Hỏi đáp',
    items: [
      'Chỉ khách đã nhận phòng hoặc hoàn tất lưu trú tại cơ sở mới được đánh giá, mỗi tài khoản một đánh giá cho mỗi cơ sở. Nhà hàng / tour: sau khi đơn hoàn tất.',
      'Điểm đánh giá hiển thị là trung bình thật từ khách; cơ sở chưa có đánh giá sẽ không hiển thị điểm.',
      'Câu hỏi về cơ sở được chính đối tác hoặc quản trị viên trả lời công khai. Vui lòng không đăng số điện thoại, địa chỉ hay thông tin cá nhân trong câu hỏi / đánh giá.',
    ],
  },
  {
    id: 'bao-mat',
    title: '6. Bảo mật & Dữ liệu cá nhân',
    items: [
      'Dữ liệu QuickStay lưu: họ tên, email, số điện thoại, lịch sử đặt chỗ, đánh giá, câu hỏi và nhật ký email đã gửi cho bạn. Thời điểm và phiên bản chính sách bạn đồng ý cũng được lưu khi đăng ký.',
      'Đối tác chỉ xem được tên khách, số điện thoại, email, ghi chú và số khách của chính các đơn đặt tại cơ sở mình để phục vụ bạn.',
      'Trợ lý AI (chat, tìm kiếm bằng ngôn ngữ tự nhiên) gửi nội dung bạn nhập tới nhà cung cấp mô hình AI (Anthropic) để tạo câu trả lời. Không nhập mật khẩu, số thẻ hay giấy tờ tùy thân vào ô chat.',
      'Mật khẩu được băm bằng BCrypt, không ai (kể cả quản trị viên) đọc được. Đổi hoặc đặt lại mật khẩu sẽ vô hiệu mọi phiên đăng nhập cũ trên các thiết bị khác.',
      'Trình duyệt chỉ lưu phiên đăng nhập và cài đặt hiển thị (ngôn ngữ, giao diện sáng / tối, lựa chọn cookie); QuickStay không dùng cookie quảng cáo.',
      'Bạn có thể xem và sửa thông tin tại trang Hồ sơ. Muốn xoá tài khoản và dữ liệu, gửi yêu cầu tới support@quickstay.io.vn từ email đã đăng ký; dữ liệu đơn đặt chỗ có thể được giữ lại theo nghĩa vụ kế toán của đối tác.',
    ],
  },
  {
    id: 'doi-tac',
    title: '7. Trách nhiệm của đối tác',
    items: [
      'Tài khoản đối tác do quản trị viên QuickStay cấp và gắn với đúng cơ sở; đối tác chỉ thao tác trên dữ liệu của cơ sở mình.',
      'Đối tác tự cập nhật loại phòng, giá, số lượng phòng, ảnh, tiện nghi, quy định và bảng giá dịch vụ; nội dung phải đúng với thực tế.',
      'Phòng bảo trì hoặc đã bán qua kênh khác phải được đóng trên Lịch phòng để khách không đặt được. Không thể đóng nhiều hơn số phòng còn trống, nên đơn của khách đã đặt luôn được giữ.',
      'Đối tác phải xác nhận hoặc từ chối đơn kịp thời và giữ phòng cho đơn đã xác nhận. Đơn bị cơ sở hủy sẽ được hoàn tiền 100% cho khách.',
    ],
  },
  {
    id: 'thay-doi',
    title: '8. Thay đổi chính sách',
    items: [
      `Phiên bản hiện hành: ${POLICY_VERSION}. Khi chính sách thay đổi, QuickStay cập nhật ngày phiên bản tại trang này; đơn đã đặt áp dụng chính sách tại thời điểm đặt.`,
      'Mọi thắc mắc hoặc khiếu nại, vui lòng gửi email tới support@quickstay.io.vn kèm mã đơn.',
    ],
  },
]

const FAQS = [
  {
    q: 'Tôi có cần thanh toán trước khi đặt phòng không?',
    a: 'Không bắt buộc. Bạn có thể chọn "Thanh toán tại khách sạn" để trả tiền khi nhận phòng, hoặc thanh toán trực tuyến sau khi đặt (hiện ở chế độ thử nghiệm, không trừ tiền thật).',
  },
  {
    q: 'Tôi hủy đơn đã được khách sạn xác nhận được không?',
    a: 'Được, miễn là trước ngày nhận phòng. Vào mục Đơn đặt phòng và bấm "Hủy đơn"; nếu đã thanh toán trực tuyến, đơn được hoàn 100%. Từ ngày nhận phòng, vui lòng liên hệ cơ sở.',
  },
  {
    q: 'Làm sao để xác thực email hoặc khôi phục mật khẩu?',
    a: 'Sau khi đăng ký, hệ thống gửi email chứa liên kết xác thực (nếu máy chủ chưa cấu hình SMTP, thư nằm trong nút "Hộp thư" trên thanh điều hướng). Quên mật khẩu: chọn "Quên mật khẩu?" ở trang Đăng nhập.',
  },
  {
    q: 'Trẻ em đi cùng có tính vào số khách không?',
    a: 'Có. Số khách khi đặt gồm cả trẻ em và không vượt quá sức chứa của phòng. Chính sách trẻ em / giường phụ cụ thể do từng cơ sở công bố ở mục Chính sách trên trang chi tiết.',
  },
  {
    q: 'Vì sao một số cơ sở chưa có điểm đánh giá?',
    a: 'QuickStay chỉ hiển thị điểm từ khách đã lưu trú thật. Cơ sở mới hoặc chưa có khách hoàn tất lưu trú sẽ hiển thị "Chưa có đánh giá".',
  },
]

export default function Policies() {
  const [openFaq, setOpenFaq] = useState(0)
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 text-white shadow-xl">
        <span className="inline-flex rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-200">
          Phiên bản {POLICY_VERSION}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Điều khoản & Chính sách</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Quy định sử dụng, đặt phòng, hủy và hoàn tiền, thanh toán, đánh giá, bảo mật dữ liệu và trách nhiệm của đối tác trên QuickStay.
        </p>
      </div>

      <nav className="mb-8 flex flex-wrap gap-2" aria-label="Mục lục chính sách">
        {POLICY_SECTIONS.map((sec) => (
          <a
            key={sec.id}
            href={`#${sec.id}`}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-blue-300"
          >
            {sec.title.replace(/^\d+\.\s*/, '')}
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        {POLICY_SECTIONS.map((sec) => (
          <section
            key={sec.id}
            id={sec.id}
            className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{sec.title}</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {sec.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-xl font-extrabold text-slate-900 dark:text-white">Câu hỏi thường gặp</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {FAQS.map((item, idx) => {
            const isOpen = openFaq === idx
            return (
              <div key={item.q} className="py-3.5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 text-left text-sm font-bold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                >
                  <span>{item.q}</span>
                  <span className="text-lg text-slate-400">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.a}</p>}
              </div>
            )
          })}
        </div>
      </section>

      <div className="mt-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
        >
          ← Quay lại tìm kiếm khách sạn
        </Link>
      </div>
    </div>
  )
}
