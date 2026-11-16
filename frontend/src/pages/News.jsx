import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../lib/i18n'

export const INITIAL_NEWS = [
  {
    id: 1,
    title: 'Top 7 Điểm Đến Nghỉ Dưỡng Mùa Thu Đẹp Nhất Việt Nam 2026',
    category: 'Điểm đến',
    featured: true,
    cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    summary: 'Từ sắc vàng mùa lúa chín Mù Cang Chải đến biển êm sóng lặng Phú Quốc, mùa thu là thời điểm lý tưởng nhất trong năm để du khách thảnh thơi du ngoạn.',
    content: `Mùa thu tại Việt Nam luôn mang lại nét quyến rũ riêng biệt với tiết trời dịu mát, nắng nhẹ và phong cảnh thiên nhiên rực rỡ nhất trong năm.

1. Đà Lạt - Mùa hồng chín và sương mù lãng đãng:
Tháng 10 và 11 là thời điểm những vườn hồng bắt đầu ngả vàng và trĩu quả khắp các thung lũng. Không khí se lạnh cùng những đợt săn mây sáng sớm tại đồi Đa Phú hay Cầu Đất khiến Đà Lạt trở thành lựa chọn hàng đầu cho các cặp đôi.

2. Phú Quốc - Mùa biển đẹp nhất trong năm:
Bước sang mùa khô, đảo Ngọc Phú Quốc đón nắng vàng và làn nước xanh như ngọc bích. Sóng êm đềm tại Bãi Sao và Bãi Khem tạo điều kiện tuyệt hảo cho các tour lặn ngắm san hô và chèo kayak.

3. Hà Nội - Hương cốm non và gió thu phố cổ:
Thu Hà Nội nồng nàn mùi hoa sữa, lá vàng rụng ngập tràn đường Phan Đình Phùng và những gánh cốm Vòng xanh mướt thơm thoảng trong gió heo may.

4. Cố Đô Huế - Dịu dàng mùa lá rụng:
Huế mùa thu bớt đi cái nắng gay gắt của miền Trung, nhường chỗ cho vẻ trầm mặc bên dòng sông Hương và sự tĩnh lặng của các lăng tẩm triều Nguyễn.`,
    author: 'Bảo Anh (VnExpress Du lịch)',
    publishDate: '15/11/2026',
    views: '18.420',
    readTime: '4 phút đọc',
  },
  {
    id: 2,
    title: 'Kinh Nghiệm Săn Phòng Khách Sạn Giá Hời Cho Kỳ Nghỉ Lễ',
    category: 'Cẩm nang & Mẹo',
    featured: false,
    cover: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    summary: 'Đặt phòng sớm 30 ngày, sử dụng mã giảm giá độc quyền QuickStay và linh hoạt ngày nhận phòng là những bí kíp giúp bạn tiết kiệm tới 40% chi phí lưu trú.',
    content: `Để có chuyến du lịch trọn vẹn mà vẫn tối ưu chi phí, việc săn phòng khách sạn đòi hỏi bạn phải có một số chiến lược thông minh:

- Đặt phòng sớm tối thiểu 3 - 4 tuần trước chuyến đi: Các khách sạn và resort thường có chính sách Early Bird với mức giá ưu đãi hơn từ 20-30%.
- Kiểm tra chính sách hủy linh hoạt: Luôn ưu tiên các phòng có chính sách "Miễn phí hủy trước 24 giờ" trên QuickStay để phòng ngừa thay đổi lịch trình bất ngờ.
- Đặt gói dịch vụ kết hợp (Hotel + Xe đưa đón): Đặt kèm xe đón tiễn sân bay tại QuickStay giúp tiết kiệm hơn nhiều so với việc gọi taxi trực tiếp tại sân bay.`,
    author: 'Minh Trí',
    publishDate: '14/11/2026',
    views: '12.850',
    readTime: '3 phút đọc',
  },
  {
    id: 3,
    title: 'Bản Đồ Ẩm Thực Đà Nẵng: 10 Món Ngon Phải Thử Bên Bờ Biển Mỹ Khê',
    category: 'Ẩm thực',
    featured: false,
    cover: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=80',
    summary: 'Mì Quảng ếch thơm nồng, bánh tráng cuốn thịt heo hai đầu da giòn rụm và hải sản tươi sống đánh bắt trong ngày là những trải nghiệm không thể bỏ lỡ.',
    content: `Đà Nẵng không chỉ nổi tiếng với những cây cầu độc đáo mà còn là thủ phủ ẩm thực miền Trung làm say lòng biết bao thực khách.

1. Mì Quảng: Sợi mì dai thơm mùi gạo mới, nước dùng sánh đậm đà ăn kèm rau sống và bánh đa nướng giòn rụm.
2. Bánh tráng cuốn thịt heo Đại Lộc: Lát thịt ba chỉ luộc khéo léo với hai đầu da mềm giòn, chấm mắm nêm đậm vị ớt tỏi.
3. Hải sản đêm đường Võ Nguyên Giáp: Những quán ăn ven biển phục vụ cua rang me, mực hấp gừng và hàu nướng phô mai nóng hổi.`,
    author: 'Hải Yến',
    publishDate: '13/11/2026',
    views: '15.630',
    readTime: '5 phút đọc',
  },
  {
    id: 4,
    title: 'Xu Hướng Nghỉ Dưỡng Staycation và Wellness Spa 2026',
    category: 'Xu hướng',
    featured: false,
    cover: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80',
    summary: 'Du khách ngày càng ưu tiên những kỳ nghỉ kết hợp chăm sóc sức khỏe, thiền định, trị liệu spa thảo mộc và ẩm thực thực dưỡng organic.',
    content: `Năm 2026 chứng kiến sự chuyển dịch mạnh mẽ trong hành vi du lịch: du khách không còn muốn chạy theo các lịch trình check-in dày đặc mà tìm kiếm sự chữa lành và tái tạo năng lượng.

Các khu nghỉ dưỡng tại Phú Quốc, Ninh Vân Bay và Đà Lạt đang đi đầu xu hướng này với các liệu trình spa bấm huyệt truyền thống, lớp yoga buổi sớm trên bãi biển và thực đơn farm-to-table sử dụng nguyên liệu địa phương tươi sạch.`,
    author: 'Thanh Hà',
    publishDate: '12/11/2026',
    views: '9.420',
    readTime: '3 phút đọc',
  },
  {
    id: 5,
    title: 'Hành Trình Khám Phá Quần Thể Danh Thắng Tràng An Từ A Đến Z',
    category: 'Điểm đến',
    featured: false,
    cover: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=900&q=80',
    summary: 'Chi tiết lộ trình 3 tuyến thuyền Tràng An, kinh nghiệm chọn góc chụp ảnh đẹp và gợi ý lưu trú thuận tiện cho chuyến đi trong ngày từ Hà Nội.',
    content: `Quần thể danh thắng Tràng An (Ninh Bình) là di sản hỗn hợp đầu tiên của Đông Nam Á được UNESCO công nhận. Với hệ thống thung lũng nước ngập quanh năm xen lẫn dãy núi đá vôi triệu năm, nơi đây tựa như bức tranh sơn thủy hữu tình ngoài đời thực.

Tuyến thuyền số 2 và 3 là hai tuyến được du khách yêu thích nhất nhờ đi qua phim trường Đảo Đầu Lâu và hang Mây dài hơn 1.000m với vô vàn thạch nhũ lung linh.`,
    author: 'Hoàng Long',
    publishDate: '10/11/2026',
    views: '14.110',
    readTime: '4 phút đọc',
  },
  {
    id: 6,
    title: 'Nghỉ Dưỡng Phong Cách Cung Đình Huế: Khi Di Sản Giao Hòa Hiện Đại',
    category: 'Khách sạn',
    featured: false,
    cover: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
    summary: 'Trải nghiệm không gian khách sạn boutique mang kiến trúc cung đình triều Nguyễn bên bờ sông Hương, nơi mỗi phòng ngủ là một bảo tàng thu nhỏ.',
    content: `Những năm gần đây, xu hướng du lịch văn hóa di sản tại Cố Đô Huế phát triển mạnh mẽ. Thay vì những tòa nhà bê tông cao tầng, du khách quốc tế và giới trẻ yêu thích các khách sạn boutique bảo tồn các chi tiết hoa văn cung đình, lồng đèn gốm sứ và nội thất gỗ chạm khắc thủ công.`,
    author: 'Mai Phương',
    publishDate: '08/11/2026',
    views: '8.760',
    readTime: '3 phút đọc',
  },
]

export default function News() {
  const { t } = useTranslation()
  const [news] = useState(INITIAL_NEWS)
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [activeArticle, setActiveArticle] = useState(null)

  const categories = ['Tất cả', 'Điểm đến', 'Ẩm thực', 'Cẩm nang & Mẹo', 'Khách sạn', 'Xu hướng']

  const leadStory = useMemo(() => {
    return news.find((n) => n.featured) || news[0]
  }, [news])

  const filteredNews = useMemo(() => {
    return news.filter((n) => {
      if (activeCategory === 'Tất cả') return true
      return n.category === activeCategory
    })
  }, [news, activeCategory])

  const mostRead = useMemo(() => {
    return [...news].sort((a, b) => parseInt(b.views.replace('.', '')) - parseInt(a.views.replace('.', ''))).slice(0, 5)
  }, [news])

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-main)] py-10 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <Link to="/" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-100 font-bold">Tin tức du lịch</span>
        </nav>

        {/* Section Header styled after VnExpress Du lịch */}
        <div className="border-b-2 border-sky-600 pb-3 mb-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-white font-black text-sm">
                V
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                QuickStay <span className="text-sky-600">Du lịch</span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cẩm nang du lịch, điểm đến hấp dẫn và xu hướng lữ hành phong cách VnExpress
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Top Section: Lead Story (Tin nổi bật) + Sidebar Trending */}
        <div className="grid lg:grid-cols-12 gap-8 mb-10">
          {/* Cột trái: Lead Featured Story (7/12) */}
          <div
            onClick={() => setActiveArticle(leadStory)}
            className="lg:col-span-8 group cursor-pointer overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card hover:shadow-card-hover transition-all duration-300"
          >
            <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={leadStory.cover}
                alt={leadStory.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
              
              <span className="absolute left-4 top-4 rounded-full bg-red-600 text-white px-3 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm">
                TIÊU ĐIỂM
              </span>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="rounded-md bg-white/20 backdrop-blur px-2.5 py-1 text-xs font-bold text-cyan-200">
                  {leadStory.category} · {leadStory.publishDate}
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mt-2 leading-snug group-hover:text-cyan-300 transition-colors drop-shadow-md">
                  {leadStory.title}
                </h2>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {leadStory.summary}
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                <span>Tác giả: <strong>{leadStory.author}</strong></span>
                <span>⏱️ {leadStory.readTime} · 👁️ {leadStory.views} lượt xem</span>
              </div>
            </div>
          </div>

          {/* Cột phải: ĐỌC NHIỀU NHẤT (VnExpress style trending list) (4/12) */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">
                  🔥
                </span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Đọc nhiều nhất
                </h3>
              </div>

              <div className="space-y-4">
                {mostRead.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveArticle(item)}
                    className="group flex items-start gap-3.5 cursor-pointer pb-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0 last:pb-0"
                  >
                    <span className={`text-2xl font-black leading-none ${index < 3 ? 'text-red-500' : 'text-slate-300 dark:text-slate-600'}`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 line-clamp-2 transition-colors leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {item.category} · {item.views} lượt xem
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60 p-3.5 text-center">
              <span className="text-lg">📩</span>
              <p className="text-xs font-bold text-sky-900 dark:text-sky-200 mt-1">Bản tin Du lịch QuickStay</p>
              <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-0.5">Nhận gợi ý điểm đến và mã giảm giá mỗi tuần.</p>
            </div>
          </div>
        </div>

        {/* Main News Grid */}
        <div className="mb-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight border-b border-slate-200 dark:border-slate-800 pb-2 mb-6">
            Mới cập nhật ({filteredNews.length} bài viết)
          </h3>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNews.map((article) => (
              <div
                key={article.id}
                onClick={() => setActiveArticle(article)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={article.cover}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute left-3 top-3 rounded-md bg-slate-950/70 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-white">
                    {article.category}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4.5">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 line-clamp-2 transition-colors leading-snug">
                    {article.title}
                  </h4>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>
                  <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{article.publishDate}</span>
                    <span>⏱️ {article.readTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Article Full Detail Modal Reader */}
        {activeArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl animate-popup-in custom-scrollbar">
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="absolute right-4 top-4 rounded-full bg-slate-100 dark:bg-slate-800 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>

              <div className="space-y-4">
                <div>
                  <span className="inline-block rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                    {activeArticle.category}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 leading-tight">
                    {activeArticle.title}
                  </h2>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span>Tác giả: <strong className="text-slate-600 dark:text-slate-200">{activeArticle.author}</strong></span>
                    <span>•</span>
                    <span>Ngày đăng: {activeArticle.publishDate}</span>
                    <span>•</span>
                    <span>{activeArticle.readTime}</span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl">
                  <img
                    src={activeArticle.cover}
                    alt={activeArticle.title}
                    className="max-h-96 w-full object-cover"
                  />
                </div>

                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {activeArticle.summary}
                </p>

                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 whitespace-pre-line">
                  {activeArticle.content}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Nguồn: QuickStay Travel Desk & VnExpress Du lịch</span>
                  <button
                    type="button"
                    onClick={() => setActiveArticle(null)}
                    className="rounded-xl bg-slate-900 dark:bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    Đóng bài viết
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
