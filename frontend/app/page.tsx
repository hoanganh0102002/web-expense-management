"use client"; // Chỉ định đây là Client Component chạy trực tiếp trên trình duyệt
import React, { useState, useEffect, useMemo } from 'react'; // Nhập thư viện React và các Hook để quản lý trạng thái, vòng đời component
import Link from 'next/link'; // Nhập thẻ Link hỗ trợ chuyển trang tối ưu trong Next.js
import { useRouter } from 'next/navigation'; // Nhập hook useRouter để điều hướng trang bằng code
import Sidebar from './components/Sidebar'; // Nhập thanh Sidebar điều hướng menu bên trái
import { useAppContext } from './context/AppContext'; // Lấy dữ liệu chia sẻ chung toàn hệ thống từ AppContext
import { useLanguage } from './lib/translations'; // Nhập thư viện đa ngôn ngữ tiếng Việt/tiếng Anh
import { budgetApi, reportApi, transactionApi, aiApi } from './lib/api'; // Các hàm API gọi lên server lấy ngân sách, báo cáo, giao dịch
import { getThisMonthRange } from './lib/dateHelpers'; // Hàm lấy ngày bắt đầu và kết thúc của tháng hiện tại
import { useAIChat } from './context/AIChatContext';

  // Hàm nhận diện và trả về biểu tượng emoji tương ứng với tên icon từ database
  const parseIcon = (iconName: string) => { // Hàm tìm và trả về emoji tương ứng với tên icon từ DB
  const iconMap: Record<string, string> = { // Khai báo đối tượng bản đồ ánh xạ các từ khóa icon sang emoji
    food: '🍜', car: '🚗', shopping_cart: '🛒', shopping_bag: '🛍️', gamepad: '🎮',
    beauty: '💇', health: '🏥', heart: '💖', receipt: '📋', house: '🏠',
    users: '🤝', chart: '📈', book: '📚', salary: '💰', award: '🏆',
    business: '🏢', profit: '💹', debt: '📉', support: '🤗', building: '🏙️',
    rings: '💍', grid: '🔲', monitor: '🖥️', cash: '💵', coffee: '☕',
    baby_clothing: '👶', book_open: '📖', paw: '🐾', dumbbell: '🏋️', baby_bottle: '🍼',
    masks: '🎭', beer: '🍺', suitcase: '🧳', tshirt: '👕', croissant: '🥐',
    graduation_cap: '🎓', water_drop_money: '💧', basket: '🧺', cigarette: '🚬', teddy_bear: '🧸',
    bread: '🍞', heart_paw: '🐾', globe: '🌍', hand_money: '🤲', coffee_cup: '☕',
    money_bag: '💰', graduation_cap_alt: '🧑‍🎓', masks_alt: '🎭', house_money: '🏠', handshake: '🤝',
    clapperboard: '🎬', medical_shield: '🛡️', lightbulb: '💡', gas_station: '⛽', gas_cylinder: '🛢️',
    flower: '🌸', inbox_archive: '📥', heart_money: '💖', house_settings: '🏠', desktop: '🖥️',
    shopping_cart_alt: '🛒', hand_coin: '🪙', piggy_bank: '🐷', scissors: '✂️', restaurant: '🍽️',
    ticket: '🎫', motorcycle: '🏍️', dumbbell_alt: '🏋️‍♀️', house_search: '🏠', school: '🏫',
    wallet_shield: '🛡️', car_settings: '🚗', first_aid: '🚑', parking: '🅿️', phone_call: '📞',
    baby_carriage: '🚼', glove: '🧤', car_shopping: '🚗', train: '🚆', chair: '🪑',
    car_alt: '🚙', bill: '🧾', teddy_bear_alt: '🧸', headphones: '🎧', laptop: '💻',
    office_chair: '💺', medical_shield_alt: '🛡️', electricity: '⚡', hand_heart: '🫶', heart_plus: '💖',
    gift_box: '🎁', spa: '💆', gift: '🎁', airplane: '✈️', chart_alt: '📊',
    wallet: '👛', water_drop: '💧', discount: '🏷️', bill_dollar: '🧾', mobile_dollar: '📱',
    bank: '🏦', network: '🌐', parking_alt: '🅿️', plane: '✈️', fire: '🔥',
    star: '⭐', music: '🎵', camera: '📷', brush: '🖌️', rocket: '🚀',
    pill: '💊', wine: '🍷', pizza: '🍕', hammer: '🔨', key: '🔑'
  };
  return iconMap[iconName] || null; // Trả về emoji nếu tìm thấy, ngược lại trả về null
};

  // Hàm chuyển đổi định dạng ngày từ chuỗi ISO sang định dạng dd/mm/yyyy
  const formatDate = (dateStr: string) => { // Hàm định dạng lại chuỗi ngày giờ thành ngày/tháng/năm
  if (!dateStr) return ''; // Trả về rỗng nếu không có dữ liệu ngày truyền vào
  try {
    const d = new Date(dateStr); // Khởi tạo đối tượng Date từ chuỗi truyền vào
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; // Trả về dạng dd/mm/yyyy
  } catch (e) { // Phòng ngừa lỗi nếu chuỗi ngày không đúng định dạng
    return dateStr; // Trả về chuỗi gốc nếu xảy ra lỗi chuyển đổi
  } // Kết thúc kiểm tra điều kiện dữ liệu
};

  // Hàm sinh ra mảng chứa chuỗi tất cả các ngày nằm giữa ngày bắt đầu và kết thúc
  const getDatesBetween = (startDateStr: string, endDateStr: string): string[] => { // Hàm trả về danh sách các ngày nằm giữa 2 mốc thời gian
  const dates: string[] = []; // Khởi tạo mảng chứa kết quả các ngày
  if (!startDateStr || !endDateStr) return dates; // Trả về mảng rỗng nếu thiếu một trong hai ngày
  let curr = new Date(startDateStr); // Khởi tạo ngày bắt đầu chạy // Đặt ngày chạy bắt đầu
  const end = new Date(endDateStr); // Khởi tạo ngày kết thúc làm mốc dừng // Đặt ngày kết thúc làm mốc dừng
  while (curr <= end) { // Vòng lặp tăng dần từng tháng một // Vòng lặp tăng dần từ ngày bắt đầu đến ngày kết thúc
    const dateString = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`; // Định dạng ngày yyyy-mm-dd
    dates.push(dateString); // Đẩy ngày vừa định dạng vào mảng kết quả
    curr.setDate(curr.getDate() + 1); // Tăng ngày hiện tại lên 1 ngày
  } // Kết thúc kiểm tra điều kiện dữ liệu
  return dates; // Trả về mảng danh sách ngày đầy đủ
};

  // Hàm sinh ra danh sách các tháng nằm giữa hai mốc thời gian
  const getMonthsBetween = (startDateStr: string, endDateStr: string): any[] => { // Hàm trả về danh sách các tháng nằm giữa 2 mốc
  const months: any[] = []; // Khởi tạo mảng chứa các đối tượng tháng
  if (!startDateStr || !endDateStr) return months; // Trả về rỗng nếu thiếu mốc thời gian
  let curr = new Date(startDateStr);
  curr.setDate(1); // Đặt ngày là mùng 1 để tránh lỗi cộng tháng bị lệch số ngày tối đa
  const end = new Date(endDateStr);
  end.setDate(1); // Đặt mốc kết thúc về ngày mùng 1
  while (curr <= end) {
    months.push({ // Đẩy thông tin tháng vào danh sách kết quả
      month: curr.getMonth() + 1, // Lưu giá trị tháng (từ 1 đến 12)
      year: curr.getFullYear(), // Lưu giá trị năm tương ứng
      label: `${String(curr.getMonth() + 1).padStart(2, '0')}/${curr.getFullYear()}` // Nhãn hiển thị mm/yyyy trên biểu đồ
    });
    curr.setMonth(curr.getMonth() + 1); // Tăng tháng hiện tại lên 1 tháng
  } // Kết thúc kiểm tra điều kiện dữ liệu
  return months; // Trả về danh sách tháng
};

export default function Dashboard() {
  const router = useRouter(); // Khởi tạo router Next.js để điều hướng trang
  //84
  const { isLoggedIn, wallets, transactions, isLoadingWallets, userData, categories, hasUnreadNotifications, unreadNotificationsCount } = useAppContext(); // Lấy dữ liệu người dùng, ví, giao dịch từ AppContext//Sử dụng useAppContext() để lấy ví, giao dịch, người dùng...
  const { setIsOpen: setChatOpen, sendMessage: sendChatMessage, startNewChat } = useAIChat();
  const [aiDigest, setAiDigest] = useState<{ summary: string; insight: string | null; suggested_questions: string[] } | null>(null);
  const [isLoadingDigest, setIsLoadingDigest] = useState(false);
  const { t, tCategory } = useLanguage(); // Hook hỗ trợ dịch đa ngôn ngữ cho giao diện
  const [showWalletBalance, setShowWalletBalance] = useState(true); // State quản lý việc ẩn hoặc hiện số dư ví
  const [selectedWalletId, setSelectedWalletId] = useState<string>(''); // State lưu ID của ví đang được chọn để lọc dữ liệu
  const [searchQuery, setSearchQuery] = useState(''); // State lưu từ khóa tìm kiếm giao dịch
  const [budgetsList, setBudgetsList] = useState<any[]>([]); // State lưu danh sách ngân sách (budgets)
  const [isLoadingBudget, setIsLoadingBudget] = useState(false); // State lưu trạng thái đang tải dữ liệu ngân sách
  // Statistics States
  const [summaryData, setSummaryData] = useState({ income: 0, expense: 0, net: 0 }); // State lưu tóm tắt doanh thu, chi tiêu, số dư ròng của kỳ hiện tại
  const [lastMonthSummary, setLastMonthSummary] = useState({ income: 0, expense: 0, net: 0 }); // State lưu tóm tắt doanh thu, chi tiêu, số dư ròng của kỳ trước
  const [trendsData, setTrendsData] = useState<any[]>([]); // State lưu dữ liệu xu hướng doanh thu & chi tiêu cho biểu đồ cột
  const [categoryData, setCategoryData] = useState<any[]>([]); // State lưu dữ liệu chi tiêu phân bổ theo các danh mục
  const [isLoadingSummary, setIsLoadingSummary] = useState(false); // State quản lý trạng thái đang tải dữ liệu tóm tắt thu chi
  const [isLoadingTrends, setIsLoadingTrends] = useState(false); // State quản lý trạng thái đang tải dữ liệu biểu đồ cột
  const [isLoadingCategory, setIsLoadingCategory] = useState(false); // State quản lý trạng thái đang tải dữ liệu biểu đồ tròn
  const [hoveredBar, setHoveredBar] = useState<{ idx: number, type: 'income' | 'expense' | null }>({ idx: -1, type: null }); // State lưu cột biểu đồ đang được hovered chuột
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null); // State lưu phân khúc biểu đồ tròn đang được hovered chuột
  const [allocationType, setAllocationType] = useState<'parent' | 'child'>('parent'); // State lưu chế độ xem danh mục cha hay con
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState<number>(0); // State lưu index danh mục đang được chọn
  const [dailyTrendsData, setDailyTrendsData] = useState<any[]>([]); // State lưu chi tiết chi tiêu hàng ngày cho biểu đồ đường
  const [isLoadingDailyTrends, setIsLoadingDailyTrends] = useState(false); // State quản lý trạng thái tải dữ liệu chi tiêu hàng ngày
  const [hoveredDailyPoint, setHoveredDailyPoint] = useState<number | null>(null); // State lưu điểm trên biểu đồ đường đang hovered chuột
  const [chartMode, setChartMode] = useState<'expense' | 'income' | 'balance'>('expense'); // State lưu chế độ xem biểu đồ đường (chi tiêu, thu nhập, số dư)
  const [hoveredTopCategory, setHoveredTopCategory] = useState<number | null>(null); // State lưu index danh mục top 5 đang hovered chuột
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'custom'>('month'); // State lưu kỳ lọc thời gian (tuần, tháng, quý, năm, tùy chỉnh)
  const [customStartDate, setCustomStartDate] = useState(''); // State lưu ngày bắt đầu tùy chọn
  const [customEndDate, setCustomEndDate] = useState(''); // State lưu ngày kết thúc tùy chọn
  const [activeStartDate, setActiveStartDate] = useState(''); // State lưu ngày bắt đầu hiệu lực được áp dụng
  const [activeEndDate, setActiveEndDate] = useState(''); // State lưu ngày kết thúc hiệu lực được áp dụng
  const [trendsGroupBy, setTrendsGroupBy] = useState<'day' | 'month'>('day'); // State lưu chế độ gom nhóm biểu đồ (theo ngày hay tháng)

  // Category Transaction Modal States
  const [transactionModalCategory, setTransactionModalCategory] = useState<any | null>(null);
  const [modalTransactions, setModalTransactions] = useState<any[]>([]);
  const [isLoadingModalTransactions, setIsLoadingModalTransactions] = useState(false);

  // Hàm mở modal hiển thị danh sách các giao dịch thuộc danh mục được chọn
  const handleOpenCategoryTransactions = (cat: any) => {
    setTransactionModalCategory(cat); // Gán thông tin danh mục được chọn vào state
    setIsLoadingModalTransactions(true); // Đặt trạng thái đang tải giao dịch chi tiết
    setModalTransactions([]); // Reset lại mảng danh sách giao dịch cũ

    // Find all categories matching the ID (including child category IDs if allocationType === 'parent')
    const catIds = [cat.category_id]; // Khởi tạo mảng danh sách ID cần truy vấn bắt đầu bằng ID danh mục hiện tại
    if (allocationType === 'parent') { // Nếu đang ở chế độ xem danh mục cha
      categories.forEach((c: any) => { // Duyệt qua tất cả danh mục hệ thống
        if (c.id === cat.category_id) { // Tìm đúng danh mục cha đang click
          if (c.children) { // Nếu danh mục cha này có các danh mục con
            c.children.forEach((sub: any) => { // Duyệt qua từng danh mục con
              catIds.push(sub.id); // Thêm ID của danh mục con vào mảng truy vấn để tính gộp
            });
          } // Kết thúc kiểm tra điều kiện dữ liệu
        } // Kết thúc kiểm tra điều kiện dữ liệu
      });
    } // Kết thúc kiểm tra chưa đăng nhập

    transactionApi.getAll({ // Gọi API lấy danh sách giao dịch từ server
      start_date: activeStartDate || undefined, // Truyền ngày bắt đầu lọc nếu có
      end_date: activeEndDate || undefined, // Truyền ngày kết thúc lọc nếu có
      wallet_id: selectedWalletId || undefined, // Truyền ID ví cần lọc nếu có
      per_page: 2000 // Giới hạn số lượng giao dịch tải về tối đa 2000 để tránh tải chậm
    })
      .then(res => { // Nhận kết quả phản hồi thành công từ Backend
        const txList = res.data?.data || res.data || []; // Trích xuất mảng giao dịch từ response
        const filtered = txList.filter((tx: any) => { // Lọc các giao dịch phù hợp với danh mục
          if (tx.type !== 'expense') return false; // Chỉ lấy các giao dịch chi tiêu (expense)
          if (tx.source_type === 'transfer' && !tx.category_id) return false; // Bỏ qua các giao dịch chuyển tiền nội bộ không phân loại
          const txCatId = tx.category_id; // Lấy ID danh mục của giao dịch hiện tại
          if (!txCatId) { // Nếu giao dịch chưa phân loại danh mục
            return catIds.includes('other') || catIds.includes('uncategorized'); // Gom vào nhóm khác hoặc chưa phân loại
          } // Kết thúc kiểm tra điều kiện dữ liệu
          return catIds.includes(txCatId); // Trả về true nếu ID danh mục nằm trong danh sách cần hiển thị
        });
        setModalTransactions(filtered); // Cập nhật mảng giao dịch lọc được vào state hiển thị trên modal
      })
      .catch(err => { // Xử lý lỗi nếu cuộc gọi API thất bại
        console.error("Error loading category transactions:", err); // In lỗi ra console để debug
      })
      .finally(() => { // Vòng kết thúc chạy sau cả thành công lẫn thất bại
        setIsLoadingModalTransactions(false); // Tắt trạng thái hiển thị loading
      });
  };

  // Reset selected category index when toggle views or data updates
  useEffect(() => { // Hook tự động thực hiện khi Dashboard được mount hoặc tháng/năm hiện tại thay đổi
    setSelectedCategoryIdx(0);
  }, [allocationType, categoryData]);

  // Bản đồ đối chiếu nhanh từ category_id sang thông tin danh mục
  const categoriesMap = useMemo(() => {
    const map: Record<string, any> = {};
    categories.forEach((parent: any) => {
      map[parent.id] = parent;
      if (parent.children) {
        parent.children.forEach((child: any) => {
          map[child.id] = { ...child, parent_name: parent.name };
        });
      } // Kết thúc kiểm tra điều kiện dữ liệu
    });
    return map;
  }, [categories]);

  // Tạo dữ liệu xu hướng hoàn chỉnh có điền sẵn giá trị 0 cho các ngày không giao dịch
  const mergedTrends = useMemo(() => {
    if (trendsGroupBy === 'day') {
      const dates = getDatesBetween(activeStartDate, activeEndDate);
      return dates.map(dateStr => {
        const found = trendsData.find(t => t.date === dateStr);
        const d = new Date(dateStr);
        return {
          label: `${d.getDate()}/${d.getMonth() + 1}`,
          date: dateStr,
          income: found ? Number(found.income) : 0,
          expense: found ? Number(found.expense) : 0
        };
      });
    } else {
      const months = getMonthsBetween(activeStartDate, activeEndDate);
      return months.map(m => {
        const found = trendsData.find(t => Number(t.month) === m.month && Number(t.year) === m.year);
        return {
          label: m.label,
          month: m.month,
          year: m.year,
          income: found ? Number(found.income) : 0,
          expense: found ? Number(found.expense) : 0
        };
      });
    } // Kết thúc kiểm tra chưa đăng nhập
  }, [trendsData, trendsGroupBy, activeStartDate, activeEndDate]);

  const now = useMemo(() => new Date(), []);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Load cache for budgets list when component mounts or month changes
  //Đọc từ localStorage để tải nhanh và ghi đè khi gọi API xong.
  useEffect(() => { // Tự động chạy lại khi các dependencies thay đổi
    if (typeof window !== 'undefined') { // Đảm bảo code chỉ chạy ở môi trường trình duyệt
      const cached = localStorage.getItem(`cached_dashboard_budgets_${currentMonth}_${currentYear}`); // Lấy ngân sách đã lưu tạm từ bộ nhớ trình duyệt
      if (cached) { // Nếu tồn tại bản lưu tạm
        try {
          setBudgetsList(JSON.parse(cached)); // Chuyển chuỗi JSON thành đối tượng và hiển thị lập tức lên giao diện
        } catch (e) { // Đề phòng lỗi cú pháp JSON
          localStorage.removeItem(`cached_dashboard_budgets_${currentMonth}_${currentYear}`); // Xóa bản cache lỗi để tránh lặp lại lỗi
        } // Kết thúc kiểm tra điều kiện dữ liệu
      } // Kết thúc kiểm tra điều kiện dữ liệu
    } // Kết thúc kiểm tra chưa đăng nhập
  }, [currentMonth, currentYear]);

  useEffect(() => { // Tự động chạy lại khi các dependencies thay đổi
    if (isLoggedIn) {
      const cacheKey = `cached_dashboard_budgets_${currentMonth}_${currentYear}`; // Khởi tạo khóa định danh lưu tạm
      const hasCache = budgetsList.length > 0 || (typeof window !== 'undefined' && localStorage.getItem(cacheKey)); // Kiểm tra đã có cache chưa
      if (!hasCache) { // Nếu chưa có cache
        setIsLoadingBudget(true); // Hiển thị trạng thái đang tải dữ liệu từ server
      } // Kết thúc kiểm tra điều kiện dữ liệu
      budgetApi.getAll(currentMonth, currentYear) // Gọi API lấy thông tin ngân sách
        .then(res => { // API phản hồi thành công
          const list = res.data || []; // Trích xuất danh sách ngân sách trả về
          setBudgetsList(list); // Gán dữ liệu ngân sách vào state
          localStorage.setItem(cacheKey, JSON.stringify(list)); // Ghi đè hoặc lưu mới vào bộ nhớ tạm trình duyệt
        })
        .catch(err => { // API lỗi
          console.error("Error fetching budgets on dashboard:", err); // Log lỗi ra màn hình console
        })
        .finally(() => { // Tắt loading
          setIsLoadingBudget(false); // Kết thúc quá trình tải ngân sách
        });
    } // Kết thúc kiểm tra chưa đăng nhập
  }, [isLoggedIn, currentMonth, currentYear, transactions]);//
  
  // AI Cashflow Digest Load & Fetch Hook
  const fetchAiDigest = (force = false) => {
    if (!isLoggedIn) {
      setAiDigest(null);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const userId = userData?.user_id || userData?.id || 'default';
    const cacheKey = `cached_ai_digest_${userId}_${todayStr}`;

    if (!force && typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const isFallback = parsed.summary?.includes('Không thể tóm tắt') || parsed.summary?.includes('Lỗi');
          if (!isFallback) {
            setAiDigest(parsed);
            return;
          } else {
            localStorage.removeItem(cacheKey);
          }
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }
    }

    setIsLoadingDigest(true);
    aiApi.getCashflowDigest()
      .then(res => {
        // Hỗ trợ cả cấu trúc cũ (res.data.ai_digest) và mới (res.data trực tiếp)
        const digestData = res.data?.ai_digest || res.data;
        if (res.status === 'success' && digestData && digestData.summary) {
          const digest = {
            summary: digestData.summary || 'Không có bản tóm tắt.',
            insight: digestData.insight || null,
            suggested_questions: Array.isArray(digestData.suggested_questions) 
              ? digestData.suggested_questions 
              : []
          };
          setAiDigest(digest);
          
          const isFallback = digest.summary.includes('Không thể tóm tắt') || digest.summary.includes('Lỗi');
          if (typeof window !== 'undefined') {
            if (!isFallback) {
              localStorage.setItem(cacheKey, JSON.stringify(digest));
            } else {
              localStorage.removeItem(cacheKey);
            }
          }
        }
      })
      .catch(err => {
        console.error("Lỗi khi tải tóm tắt dòng tiền từ AI:", err);
        setAiDigest({
          summary: 'Không thể kết nối hoặc có lỗi xảy ra từ máy chủ khi tóm tắt tài chính.',
          insight: null,
          suggested_questions: []
        });
      })
      .finally(() => {
        setIsLoadingDigest(false);
      });
  };

  useEffect(() => {
    fetchAiDigest(false);
  }, [isLoggedIn, userData]);



  // Save dashboard statistics cache when data updates
  //Lưu dữ liệu biểu đồ, doanh thu, chi tiêu vào localStorage theo bộ lọc.
  useEffect(() => { // Tự động chạy lại khi các dependencies thay đổi
    if (isLoggedIn && typeof window !== 'undefined') { // Kiểm tra nếu người dùng đã đăng nhập và đang ở trình duyệt
      const cacheKey = `cached_dashboard_stats_${selectedWalletId}_${timePeriod}_${customStartDate}_${customEndDate}_${trendsGroupBy}`; // Tạo khóa cache dựa trên các bộ lọc
      if ( // Bắt đầu khối kiểm tra dữ liệu thực tế
        summaryData.income !== 0 || // Tổng thu nhập khác 0 hoặc
        summaryData.expense !== 0 || // Tổng chi tiêu khác 0 hoặc
        categoryData.length > 0 || // Có dữ liệu danh mục chi tiêu hoặc
        trendsData.length > 0 || // Có dữ liệu xu hướng biểu đồ cột hoặc
        dailyTrendsData.length > 0 // Có dữ liệu xu hướng biểu đồ đường
      ) { // Nếu có ít nhất một dữ liệu tồn tại
        localStorage.setItem(cacheKey, JSON.stringify({ // Lưu trữ dữ liệu vào localStorage để hiển thị nhanh lần sau
          summaryData, // Lưu dữ liệu tóm tắt thu chi
          lastMonthSummary, // Lưu dữ liệu tóm tắt kỳ trước
          categoryData, // Lưu dữ liệu danh mục chi tiêu
          trendsData, // Lưu dữ liệu biểu đồ cột
          dailyTrendsData // Lưu dữ liệu biểu đồ đường
        })); // Đóng hàm lưu cache
      } // Kết thúc kiểm tra điều kiện dữ liệu
    } // Kết thúc kiểm tra chưa đăng nhập
  }, [summaryData, lastMonthSummary, categoryData, trendsData, dailyTrendsData, isLoggedIn, selectedWalletId, timePeriod, customStartDate, customEndDate, trendsGroupBy]); // Danh sách các biến theo dõi sự thay đổi
  //
  // Fetch report data based on time period
  useEffect(() => { // Tự động chạy lại khi các dependencies thay đổi
    if (!isLoggedIn) { // Nếu người dùng chưa đăng nhập hệ thống
      setSummaryData({ income: 0, expense: 0, net: 0 }); // Đặt dữ liệu tóm tắt thu chi về 0
      setLastMonthSummary({ income: 0, expense: 0, net: 0 }); // Đặt dữ liệu tóm tắt kỳ trước về 0
      setCategoryData([]); // Xóa danh sách dữ liệu danh mục chi tiêu
      setTrendsData([]); // Xóa danh sách dữ liệu xu hướng biểu đồ cột
      setDailyTrendsData([]); // Xóa danh sách dữ liệu xu hướng biểu đồ đường
      return; // Dừng thực thi tiếp tục bên dưới
    } // Kết thúc kiểm tra chưa đăng nhập

    // Determine date range
    let start_date = '';
    let end_date = '';
    let last_month_start = '';
    let last_month_end = '';
    let trendsGroupBy: 'day' | 'month' = 'day';
    //Lưu dữ liệu biểu đồ, doanh thu, chi tiêu vào localStorage theo bộ lọc.
    const nowVal = new Date();

    switch (timePeriod) {
      case 'week': {
        const day = nowVal.getDay();
        const diff = nowVal.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(nowVal.setDate(diff));
        start_date = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        end_date = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

        // Last week dates
        const prevMonday = new Date(monday);
        prevMonday.setDate(monday.getDate() - 7);
        last_month_start = `${prevMonday.getFullYear()}-${String(prevMonday.getMonth() + 1).padStart(2, '0')}-${String(prevMonday.getDate()).padStart(2, '0')}`;

        const prevSunday = new Date(prevMonday);
        prevSunday.setDate(prevMonday.getDate() + 6);
        last_month_end = `${prevSunday.getFullYear()}-${String(prevSunday.getMonth() + 1).padStart(2, '0')}-${String(prevSunday.getDate()).padStart(2, '0')}`;

        trendsGroupBy = 'day';
        break;
      } // Kết thúc kiểm tra điều kiện dữ liệu
      case 'month': {
        const firstDay = new Date(nowVal.getFullYear(), nowVal.getMonth(), 1);
        const lastDay = new Date(nowVal.getFullYear(), nowVal.getMonth() + 1, 0);
        start_date = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-01`;
        end_date = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

        // Last month dates
        const lastMonthDate = new Date(nowVal.getFullYear(), nowVal.getMonth() - 1, 1);
        last_month_start = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
        last_month_end = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-${String(new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

        trendsGroupBy = 'day';
        break;
      } // Kết thúc kiểm tra điều kiện dữ liệu
      case 'quarter': {
        const quarter = Math.floor(nowVal.getMonth() / 3);
        const firstMonth = quarter * 3;
        const lastMonth = firstMonth + 2;
        const firstDay = new Date(nowVal.getFullYear(), firstMonth, 1);
        const lastDay = new Date(nowVal.getFullYear(), lastMonth + 1, 0);
        start_date = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-01`;
        end_date = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

        // Last quarter dates
        const prevQuarterFirstMonth = firstMonth - 3 >= 0 ? firstMonth - 3 : 9;
        const prevQuarterYear = firstMonth - 3 >= 0 ? nowVal.getFullYear() : nowVal.getFullYear() - 1;
        const prevQuarterFirstDay = new Date(prevQuarterYear, prevQuarterFirstMonth, 1);
        const prevQuarterLastDay = new Date(prevQuarterYear, prevQuarterFirstMonth + 3, 0);
        last_month_start = `${prevQuarterFirstDay.getFullYear()}-${String(prevQuarterFirstDay.getMonth() + 1).padStart(2, '0')}-01`;
        last_month_end = `${prevQuarterLastDay.getFullYear()}-${String(prevQuarterLastDay.getMonth() + 1).padStart(2, '0')}-${String(prevQuarterLastDay.getDate()).padStart(2, '0')}`;

        trendsGroupBy = 'month';
        break;
      } // Kết thúc kiểm tra điều kiện dữ liệu
      case 'year': {
        start_date = `${nowVal.getFullYear()}-01-01`;
        end_date = `${nowVal.getFullYear()}-12-31`;

        // Last year dates
        last_month_start = `${nowVal.getFullYear() - 1}-01-01`;
        last_month_end = `${nowVal.getFullYear() - 1}-12-31`;

        trendsGroupBy = 'month';
        break;
      } // Kết thúc kiểm tra điều kiện dữ liệu
      case 'custom': {
        if (!customStartDate || !customEndDate) return; // Wait until dates are entered
        start_date = customStartDate;
        end_date = customEndDate;

        // Compare with same duration shifted back
        const s = new Date(customStartDate);
        const e = new Date(customEndDate);
        const diffDays = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const prevS = new Date(s);
        prevS.setDate(s.getDate() - diffDays);
        const prevE = new Date(e);
        prevE.setDate(e.getDate() - diffDays);

        last_month_start = `${prevS.getFullYear()}-${String(prevS.getMonth() + 1).padStart(2, '0')}-${String(prevS.getDate()).padStart(2, '0')}`;
        last_month_end = `${prevE.getFullYear()}-${String(prevE.getMonth() + 1).padStart(2, '0')}-${String(prevE.getDate()).padStart(2, '0')}`;

        trendsGroupBy = diffDays <= 45 ? 'day' : 'month';
        break;
      } // Kết thúc kiểm tra điều kiện dữ liệu
    } // Kết thúc kiểm tra chưa đăng nhập
    //
    setActiveStartDate(start_date);//
    setActiveEndDate(end_date);//
    setTrendsGroupBy(trendsGroupBy);
    //Tải lại dữ liệu biểu đồ cũ từ bộ nhớ tạm trước khi lấy dữ liệu mới.
    const cacheKey = `cached_dashboard_stats_${selectedWalletId}_${timePeriod}_${customStartDate}_${customEndDate}_${trendsGroupBy}`; // Tạo khóa cache dựa trên các bộ lọc
    let hasCache = false;
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey); // Đọc dữ liệu đã lưu tạm trong bộ nhớ trình duyệt
      if (cached) {
        hasCache = true; // Đánh dấu đã tải thành công dữ liệu từ cache để giảm thời gian hiển thị
        try {
          const parsed = JSON.parse(cached); // Chuyển đổi chuỗi JSON lưu tạm thành đối tượng dữ liệu
          if (parsed.summaryData) setSummaryData(parsed.summaryData); // Nạp nhanh dữ liệu tóm tắt thu chi từ cache
          if (parsed.lastMonthSummary) setLastMonthSummary(parsed.lastMonthSummary); // Nạp nhanh dữ liệu tóm tắt kỳ trước từ cache
          if (parsed.categoryData) setCategoryData(parsed.categoryData); // Nạp nhanh dữ liệu phân bổ danh mục từ cache
          if (parsed.trendsData) setTrendsData(parsed.trendsData); // Nạp nhanh dữ liệu xu hướng biểu đồ cột từ cache
          if (parsed.dailyTrendsData) setDailyTrendsData(parsed.dailyTrendsData); // Nạp nhanh dữ liệu xu hướng biểu đồ đường từ cache
        } catch (e) {
          localStorage.removeItem(cacheKey); // Xóa cache cũ nếu định dạng không khớp
          hasCache = false;
        } // Kết thúc kiểm tra điều kiện dữ liệu
      } // Kết thúc kiểm tra điều kiện dữ liệu
    }//

    // Fetch summary
    if (!hasCache) {
      setIsLoadingSummary(true);
    } // Kết thúc kiểm tra chưa đăng nhập
    reportApi.getSummary(start_date, end_date, selectedWalletId || undefined)
      .then(res => { // API phản hồi thành công
        if (res.status === 'success' && res.data) {
          setSummaryData(res.data);
        } // Kết thúc kiểm tra điều kiện dữ liệu
      })
      .catch(err => console.error("Error fetching summary:", err))
      .finally(() => setIsLoadingSummary(false));

    // Fetch last period's summary for comparison
    if (last_month_start && last_month_end) {
      reportApi.getSummary(last_month_start, last_month_end, selectedWalletId || undefined)
        .then(res => { // API phản hồi thành công
          if (res.status === 'success' && res.data) {
            setLastMonthSummary(res.data);
          } // Kết thúc kiểm tra điều kiện dữ liệu
        })
        .catch(err => console.error("Error fetching last period summary:", err));
    } // Kết thúc kiểm tra chưa đăng nhập

    // Helper functions for date formatting in client-side calculations
    const getLocalDateString = (isoString: string) => {
      try {
        const d = new Date(isoString);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } catch (e) {
        return isoString.substring(0, 10);
      } // Kết thúc kiểm tra điều kiện dữ liệu
    };

    const getLocalMonthString = (isoString: string) => {
      try {
        const d = new Date(isoString);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } catch (e) {
        return isoString.substring(0, 7);
      } // Kết thúc kiểm tra điều kiện dữ liệu
    };
    //
    if (selectedWalletId) {
      // Fetch category and daily spending stats: We load transactions for the selected range filtered by wallet
      if (!hasCache) {
        setIsLoadingCategory(true);
        setIsLoadingDailyTrends(true);
        setIsLoadingTrends(true);
      } // Kết thúc kiểm tra điều kiện dữ liệu
      //Gọi transactionApi.getAll lọc theo ví, rồi dùng forEach cộng dồn danh mục và xu hướng trên client.
      transactionApi.getAll({ start_date, end_date, per_page: 2000, wallet_id: selectedWalletId }) // Gọi API lấy danh sách giao dịch từ server
        .then(res => { // API phản hồi thành công
          const txList = res.data?.data || res.data || []; // Trích xuất mảng giao dịch từ response
          const grouped: Record<string, any> = {};

          // Calculate daily trends client-side
          const dailyMap: Record<string, number> = {};
          const monthlyMap: Record<string, number> = {};
          const trendsMap: Record<string, { income: number; expense: number }> = {};

          txList.forEach((tx: any) => {
            const amt = Math.abs(parseFloat(tx.amount_in_user_currency || tx.amount || 0));
            const type = tx.type;

            // Categories grouping (only for expense, exclude internal transfers)
            if (type === 'expense' && amt > 0 && !(tx.source_type === 'transfer' && !tx.category_id)) {
              const catId = tx.category_id || 'other';
              const fullCat = categoriesMap[catId];

              const catName = tCategory(fullCat?.name || tx.category?.name || tx.category_name || 'Other');
              const catColor = fullCat?.color || tx.category?.color || '#718EBF';
              const catIcon = fullCat?.icon || tx.category?.icon || '📁';
              const parentId = fullCat?.parent_id || tx.category?.parent_id || null;

              let parentName = fullCat?.parent_name || tx.category?.parent?.name || null;
              if (!parentName && parentId) {
                parentName = categoriesMap[parentId]?.name || null;
              } // Kết thúc kiểm tra điều kiện dữ liệu
              if (parentName) {
                parentName = tCategory(parentName);
              } // Kết thúc kiểm tra điều kiện dữ liệu

              if (!grouped[catId]) {
                grouped[catId] = {
                  category_id: catId,
                  category_name: catName,
                  category_color: catColor,
                  category_icon: catIcon,
                  parent_id: parentId,
                  parent_name: parentName,
                  amount: 0
                };
              } // Kết thúc kiểm tra điều kiện dữ liệu
              grouped[catId].amount += amt;
            } // Kết thúc kiểm tra điều kiện dữ liệu

            // Trends grouping (daily & monthly)
            const dateStr = tx.transaction_date ? tx.transaction_date.substring(0, 10) : '';
            if (dateStr && !(tx.source_type === 'transfer' && !tx.category_id)) {
              const localDate = getLocalDateString(tx.transaction_date);
              const localMonth = getLocalMonthString(tx.transaction_date);

              // Daily/monthly expense for spline
              if (type === 'expense') {
                dailyMap[localDate] = (dailyMap[localDate] || 0) + amt;
                monthlyMap[localMonth] = (monthlyMap[localMonth] || 0) + amt;
              } // Kết thúc kiểm tra điều kiện dữ liệu

              // Income vs Expense grouped by day/month for column chart
              const key = trendsGroupBy === 'day' ? localDate : localMonth;
              if (!trendsMap[key]) {
                trendsMap[key] = { income: 0, expense: 0 };
              } // Kết thúc kiểm tra điều kiện dữ liệu
              if (type === 'income') {
                trendsMap[key].income += amt;
              } else if (type === 'expense') {
                trendsMap[key].expense += amt;
              } // Kết thúc kiểm tra điều kiện dữ liệu
            } // Kết thúc kiểm tra điều kiện dữ liệu
          });

          setCategoryData(Object.values(grouped));

          // Format daily trends matching SVG expectations
          const computedDailyTrends: any[] = [];
          if (trendsGroupBy === 'day') {
            Object.entries(dailyMap).forEach(([date, expense]) => {
              computedDailyTrends.push({ date, expense });
            });
          } else {
            Object.entries(monthlyMap).forEach(([monthStr, expense]) => {
              const [year, month] = monthStr.split('-');
              computedDailyTrends.push({
                month: parseInt(month, 10),
                year: parseInt(year, 10),
                expense
              });
            });
          } // Kết thúc kiểm tra điều kiện dữ liệu
          setDailyTrendsData(computedDailyTrends);

          // Format trends data for column chart matching API expectations
          const computedTrends: any[] = [];
          if (trendsGroupBy === 'day') {
            Object.entries(trendsMap).forEach(([date, val]) => {
              const d = new Date(date);
              computedTrends.push({
                label: `${d.getDate()}/${d.getMonth() + 1}`,
                date,
                income: val.income,
                expense: val.expense
              });
            });
          } else {
            Object.entries(trendsMap).forEach(([monthStr, val]) => {
              const [year, month] = monthStr.split('-');
              computedTrends.push({
                label: `${month}/${year}`,
                month: parseInt(month, 10),
                year: parseInt(year, 10),
                income: val.income,
                expense: val.expense
              });
            });
          } // Kết thúc kiểm tra điều kiện dữ liệu
          setTrendsData(computedTrends);
        })
        .catch(err => console.error("Error fetching categories and trends via transactions:", err))
        .finally(() => { // Khối lệnh luôn luôn thực thi sau khi hoàn tất
          setIsLoadingCategory(false);
          setIsLoadingDailyTrends(false); // Tắt hiển thị trạng thái loading biểu đồ đường
          setIsLoadingTrends(false); // Tắt hiển thị trạng thái loading biểu đồ cột
        });
    } else {
      // Selected wallet is empty (All wallets) -> Query aggregated backend API
      if (!hasCache) {
        setIsLoadingCategory(true);
        setIsLoadingDailyTrends(true);
        setIsLoadingTrends(true);
      } // Kết thúc kiểm tra điều kiện dữ liệu

      // 1. Fetch categories
      reportApi.getCategories({ start_date, end_date, type: 'expense' }) // Gọi API Backend lấy danh sách chi tiêu theo danh mục
        .then(res => { // API phản hồi thành công
          if (res.status === 'success' && res.data) {
            const list = (res.data.categories || []).map((cat: any) => ({ // Duyệt qua từng danh mục và tạo đối tượng mới
              ...cat,
              category_name: tCategory(cat.category_name), // Dịch tên danh mục sang ngôn ngữ hiển thị (tiếng Việt/tiếng Anh)
              parent_name: cat.parent_name ? tCategory(cat.parent_name) : null // Dịch tên danh mục cha nếu có
            })); // Đóng hàm lưu cache
            setCategoryData(list); // Lưu danh sách danh mục đã xử lý ngôn ngữ vào state để vẽ biểu đồ tròn
          } // Kết thúc kiểm tra điều kiện dữ liệu
        })
        .catch(err => console.error("Error fetching categories:", err)) // Xử lý lỗi nếu gọi danh mục thất bại
        .finally(() => setIsLoadingCategory(false)); // Tắt trạng thái hiển thị loading của biểu đồ tròn

      // 2. Fetch trends (for both columns and line charts)
      reportApi.getTrends(start_date, end_date, trendsGroupBy) // Gọi API Backend lấy dữ liệu xu hướng thu chi
        .then(res => { // API phản hồi thành công
          if (res.status === 'success' && res.data) {
            setTrendsData(res.data || []); // Cập nhật dữ liệu xu hướng cho biểu đồ cột
            setDailyTrendsData(res.data || []); // Cập nhật dữ liệu xu hướng cho biểu đồ đường spline
          } // Kết thúc kiểm tra điều kiện dữ liệu
        })
        .catch(err => console.error("Error fetching trends:", err)) // Xử lý lỗi gọi API xu hướng
        .finally(() => { // Khối lệnh luôn luôn thực thi sau khi hoàn tất
          setIsLoadingDailyTrends(false); // Tắt hiển thị trạng thái loading biểu đồ đường
          setIsLoadingTrends(false); // Tắt hiển thị trạng thái loading biểu đồ cột
        });
    } // Kết thúc kiểm tra chưa đăng nhập

  }, [isLoggedIn, timePeriod, customStartDate, customEndDate, transactions, categoriesMap, selectedWalletId, trendsGroupBy]);

  // Hàm xử lý việc sao chép cấu hình ngân sách từ tháng trước sang tháng này
  const handleCopyBudgets = async () => {
    const fromMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const fromYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    if (window.confirm(t('copy_budget_confirm_msg').replace('{from}', `${fromMonth}/${fromYear}`).replace('{to}', `${currentMonth}/${currentYear}`))) {
      setIsLoadingBudget(true);
      try {
        const res = await budgetApi.copy({
          from_month: fromMonth,
          from_year: fromYear,
          to_month: currentMonth,
          to_year: currentYear
        });
        alert(t('copy_budget_success').replace('{count}', (res.data?.length || 0).toString()));
        const budgetsRes = await budgetApi.getAll(currentMonth, currentYear);
        const list = budgetsRes.data || [];
        setBudgetsList(list);
        localStorage.setItem(`cached_dashboard_budgets_${currentMonth}_${currentYear}`, JSON.stringify(list));
      } catch (error: any) {
        alert(error.message || t('copy_budget_error'));
      } finally {
        setIsLoadingBudget(false);
      } // Kết thúc kiểm tra điều kiện dữ liệu
    } // Kết thúc kiểm tra chưa đăng nhập
  };

  // Calculate overall budget stats
  const overallBudget = budgetsList.find(b => b.category_id === null); // Tìm cấu hình ngân sách chung của cả tháng
  const categoryBudgets = budgetsList.filter(b => b.category_id !== null); // Lấy danh sách ngân sách cụ thể của từng danh mục

  // Tính tổng hạn mức ngân sách: nếu có ngân sách chung thì lấy, không thì cộng dồn các danh mục
  const rawTotalLimit = overallBudget
    ? parseFloat(overallBudget.limit_amount)
    : categoryBudgets.reduce((sum, b) => sum + parseFloat(b.limit_amount), 0);
  const totalLimit = isNaN(rawTotalLimit) || !isFinite(rawTotalLimit) ? 0 : rawTotalLimit; // Tổng hạn mức ngân sách an toàn

  // Tính tổng số tiền đã chi tiêu nằm trong ngân sách
  const rawTotalUsed = overallBudget
    ? parseFloat(overallBudget.used_amount)
    : categoryBudgets.reduce((sum, b) => sum + parseFloat(b.used_amount), 0);
  const totalUsed = isNaN(rawTotalUsed) || !isFinite(rawTotalUsed) ? 0 : rawTotalUsed; // Tổng số tiền đã dùng an toàn

  // Tính tỷ lệ phần trăm ngân sách đã sử dụng thực tế
  const totalPct = (totalLimit > 0 && isFinite(totalLimit) && !isNaN(totalLimit) && isFinite(totalUsed) && !isNaN(totalUsed))
    ? Math.round((totalUsed / totalLimit) * 100)
    : 0;

  // Tính toán số liệu từ dữ liệu thật
  const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.available_balance || 0), 0); // Tính tổng số dư khả dụng từ tất cả các ví
  const displayIncome = summaryData.income; // Số tiền tổng thu nhập hiển thị trên ô Tổng Thu Nhập
  const displayExpense = summaryData.expense; // Số tiền tổng chi tiêu hiển thị trên ô Tổng Chi Tiêu
  const displayNet = summaryData.net; // Tính số dư ròng (Tổng Thu - Tổng Chi) hiển thị trên ô Số Dư Ròng

  // So sánh tháng này vs tháng trước (tăng/giảm %)
  const lastExpense = lastMonthSummary.expense;
  const safeDisplayExpense = isNaN(displayExpense) || !isFinite(displayExpense) ? 0 : displayExpense;
  const safeLastExpense = isNaN(lastExpense) || !isFinite(lastExpense) ? 0 : lastExpense;
  // Tính phần trăm chênh lệch chi tiêu của kỳ này so với kỳ trước
  const expenseChangePercent = (safeLastExpense > 0 && isFinite(safeLastExpense) && !isNaN(safeLastExpense) && isFinite(safeDisplayExpense) && !isNaN(safeDisplayExpense))
    ? ((safeDisplayExpense - safeLastExpense) / safeLastExpense) * 100
    : (safeDisplayExpense > 0 ? 100 : 0);

  // Group all categories by their parent category to avoid double counting
  const rootCategoriesMap: Record<string, any> = {}; // Gom các khoản chi tiêu danh mục con vào danh mục cha tương ứng

  categoryData.forEach(cat => {
    const amount = Math.abs(cat.amount);
    if (amount === 0) return;

    if (cat.parent_id === null) {
      // It's a root category
      if (!rootCategoriesMap[cat.category_id]) {
        rootCategoriesMap[cat.category_id] = { ...cat, amount: 0 };
      } // Kết thúc kiểm tra điều kiện dữ liệu
      rootCategoriesMap[cat.category_id].amount += amount;
    } else {
      // It's a subcategory - group it into its parent
      const parentId = cat.parent_id;
      const parentCat = categoriesMap[parentId];
      const parentName = tCategory(parentCat?.name || cat.parent_name || 'Other');
      const parentColor = parentCat?.color || cat.category_color || '#718EBF';
      const parentIcon = parentCat?.icon || cat.category_icon || '📁';

      if (!rootCategoriesMap[parentId]) {
        rootCategoriesMap[parentId] = {
          category_id: parentId,
          category_name: parentName,
          category_color: parentColor,
          category_icon: parentIcon,
          parent_id: null,
          amount: 0
        };
      } // Kết thúc kiểm tra điều kiện dữ liệu
      rootCategoriesMap[parentId].amount += amount;
    } // Kết thúc kiểm tra chưa đăng nhập
  });

  const rootCategoriesList = Object.values(rootCategoriesMap).sort((a: any, b: any) => b.amount - a.amount); // Chuyển đối tượng danh mục cha thành mảng và sắp xếp chi tiêu
  const totalCategoryExpense = rootCategoriesList.reduce((sum, cat) => sum + cat.amount, 0); // Tính tổng chi tiêu cộng gộp từ các danh mục cha

  // Compute active categories list based on allocationType
  let activeCategoriesList: any[] = [];
  if (allocationType === 'parent') {
    activeCategoriesList = rootCategoriesList;
  } else {
    // Show child categories (where amount > 0)
    activeCategoriesList = categoryData
      .filter(cat => Math.abs(cat.amount) > 0)
      .map(cat => ({
        ...cat,
        amount: Math.abs(cat.amount)
      }))
      .sort((a: any, b: any) => b.amount - a.amount);
  } // Kết thúc kiểm tra điều kiện dữ liệu

  // Compute correct percentages
  // Bổ sung tỷ lệ phần trăm chi tiêu của từng danh mục so với tổng chi tiêu
  const processedCategoryData = activeCategoriesList.map((cat: any) => {
    const amt = isNaN(cat.amount) || !isFinite(cat.amount) ? 0 : cat.amount;
    const totalExp = isNaN(totalCategoryExpense) || !isFinite(totalCategoryExpense) ? 0 : totalCategoryExpense;
    const pct = (totalExp > 0 && isFinite(totalExp) && !isNaN(totalExp) && isFinite(amt) && !isNaN(amt)) ? Math.round((amt / totalExp) * 100) : 0;
    return {
      ...cat,
      percentage: pct
    };
  });

  // Lấy ra 5 danh mục cha có mức chi tiêu cao nhất để hiển thị bảng xếp hạng
  const top5Categories = rootCategoriesList.map((cat: any) => {
    const amt = isNaN(cat.amount) || !isFinite(cat.amount) ? 0 : cat.amount;
    const totalExp = isNaN(totalCategoryExpense) || !isFinite(totalCategoryExpense) ? 0 : totalCategoryExpense;
    const pct = (totalExp > 0 && isFinite(totalExp) && !isNaN(totalExp) && isFinite(amt) && !isNaN(amt)) ? Math.round((amt / totalExp) * 100) : 0;
    return {
      ...cat,
      percentage: pct
    };
  }).slice(0, 5);

  // SVG Donut Chart Setup
  const radius = 38;
  const circumference = 2 * Math.PI * radius;



  // Lấy danh sách giao dịch gần đây, lọc theo ví nếu có chọn ví cụ thể
  const filteredRecentTransactions = useMemo(() => {
    if (!selectedWalletId) return transactions;
    return transactions.filter((tx: any) => tx.wallet_id === selectedWalletId);
  }, [transactions, selectedWalletId]);

  // Hàm định dạng số tiền sang chuẩn tiền tệ Việt Nam đồng (VND)
  const formatCurrency = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return '0';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numericAmount);
  };

  const displayName = userData?.profile?.full_name || userData?.full_name || userData?.name || t('new_user'); // Xác định tên người dùng để hiển thị

  return (
    <div className="dashboard-container">
      <Sidebar activeItem="dashboard" />
      <main className="main-content" style={{ background: 'var(--bg-color)' }}>
        <nav className="navbar">
          <h1 className="page-title">{t('dashboard')}</h1>
          <div className="nav-actions">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
              } // Kết thúc kiểm tra điều kiện dữ liệu
            }} className="search-bar">
              <span style={{ fontSize: '16px', /* Cỡ chữ 16px */ display: 'flex', alignItems: 'center', userSelect: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <button
              onClick={() => router.push('/reports')}
              style={{ background: '#1814F3', color: '#fff', padding: '10px 20px', borderRadius: '24px', fontWeight: '600', /* Độ đậm chữ 600 (Vừa) */ border: 'none', cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              {t('add_report')}
            </button>
            <Link href="/notifications" style={{ background: '#F5F7FA', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffb300', cursor: 'pointer', fontSize: '20px', /* Cỡ chữ 20px */ textDecoration: 'none', position: 'relative' }}>
              🔔
              {isLoggedIn && hasUnreadNotifications && unreadNotificationsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  minWidth: '16px',
                  height: '16px',
                  background: '#FE5C73',
                  color: '#fff',
                  borderRadius: '10px',
                  border: '2px solid #fff',
                  fontSize: '9px',
                  fontWeight: '800', /* Độ đậm chữ 800 (Rất đậm) */
                  display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */
                  alignItems: 'center', /* Căn các phần tử con giữa theo chiều dọc */
                  justifyContent: 'center', /* Căn giữa các phần tử con theo chiều ngang */
                  padding: '0 4px'
                }}>
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>
            {isLoggedIn ? (
              <div style={{ display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */ alignItems: 'center', gap: '15px' }}>
                <span style={{ fontWeight: '600', /* Độ đậm chữ 600 (Vừa) */ color: 'var(--text-main)', fontSize: '15px' }}>{displayName}</span>
                <div style={{ position: 'relative', width: '45px', height: '45px' }}>
                  <img src={userData?.profile?.avatar_url || userData?.avatar_url || userData?.avatar || "https://api.dicebear.com/7.x/miniavs/svg?seed=EM&backgroundColor=b6e3f4"} alt="Avatar" className="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#16DBCC', border: '2px solid #fff', borderRadius: '50%' }}></div>
                </div>
              </div>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none', color: '#fff', background: '#343C6A', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>{t('login')}</Link>
            )}
          </div>
        </nav>
        <div className="content-area">
          {/* Time Filter Bar */}
          <div style={{
            display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */
            flexWrap: 'wrap',
            justifyContent: 'space-between', /* Đẩy các phần tử con ra xa nhau về hai biên */
            alignItems: 'center', /* Căn các phần tử con giữa theo chiều dọc */
            background: 'var(--card-bg)',
            padding: '12px 20px',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid var(--border-color)',
            gap: '16px',
            marginBottom: '5px'
          }}>
            <div style={{ display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */ gap: '8px', flexWrap: 'wrap' }}>
              {(['week', 'month', 'quarter', 'year', 'custom'] as const).map((p) => {
                const labelMap = {
                  week: t('this_week') || 'Tuần này',
                  month: t('this_month') || 'Tháng này',
                  quarter: t('this_quarter') || 'Quý này',
                  year: t('this_year') || 'Năm này',
                  custom: t('custom_period') || 'Tùy chỉnh'
                };
                const isActive = timePeriod === p;
                return (
                  <button
                    key={p}
                    onClick={() => setTimePeriod(p)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '12px',
                      fontSize: '13px', /* Cỡ chữ 13px */
                      fontWeight: '600', /* Độ đậm chữ 600 (Vừa) */
                      cursor: 'pointer',
                      background: isActive ? 'var(--accent-gradient)' : 'var(--bg-color)',
                      color: isActive ? '#FFFFFF' : 'var(--text-light)',
                      border: `1px solid ${isActive ? 'transparent' : 'var(--border-color)'}`,
                      boxShadow: isActive ? '0 4px 10px rgba(24, 20, 243, 0.2)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {labelMap[p]}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Inputs & Wallet Filter */}
            <div style={{ display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */ alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {timePeriod === 'custom' && (
                <div style={{
                  display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */
                  alignItems: 'center', /* Căn các phần tử con giữa theo chiều dọc */
                  gap: '8px',
                  flexWrap: 'wrap',
                  animation: 'fadeUpIn 0.3s ease-out'
                }}>
                  <div style={{ display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */ alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', /* Độ đậm chữ 600 (Vừa) */ }}>{t('from_date')}</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        fontSize: '13px', /* Cỡ chữ 13px */
                        color: 'var(--text-main)', /* Màu chữ chính của theme */
                        background: 'var(--bg-color)'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */ alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', /* Độ đậm chữ 600 (Vừa) */ }}>{t('to_date')}</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        fontSize: '13px', /* Cỡ chữ 13px */
                        color: 'var(--text-main)', /* Màu chữ chính của theme */
                        background: 'var(--bg-color)'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Wallet Selector Dropdown */}
              {isLoggedIn && wallets.length > 0 && (
                <div style={{ display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */ alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', /* Độ đậm chữ 600 (Vừa) */ whiteSpace: 'nowrap' }}>
                    {t('filter_by_wallet') || 'Lọc theo ví:'}
                  </span>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px', /* Cỡ chữ 13px */
                      fontWeight: '600', /* Độ đậm chữ 600 (Vừa) */
                      color: 'var(--text-main)', /* Màu chữ chính của theme */
                      background: 'var(--card-bg)',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <option value="">{t('all_wallets') || 'Tất cả ví'}</option>
                    {wallets.map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(parseFloat(w.available_balance))})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="balance-overview">
            <div className="balance-item">
              <div className="balance-label">{t('total_income')}</div>
              <div className="balance-val">{isLoggedIn ? formatCurrency(displayIncome) : formatCurrency(0)}</div>
            </div>
            <div className="balance-divider"></div>
            <div className="balance-item">
              <div className="balance-label">{t('total_expense')}</div>
              <div className="balance-val">{isLoggedIn ? formatCurrency(displayExpense) : formatCurrency(0)}</div>
              {isLoggedIn && (
                <div style={{
                  display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */
                  alignItems: 'center', /* Căn các phần tử con giữa theo chiều dọc */
                  gap: '4px',
                  fontSize: '11px', /* Cỡ chữ 11px */
                  fontWeight: '600', /* Độ đậm chữ 600 (Vừa) */
                  marginTop: '4px'
                }}>
                  {expenseChangePercent > 0 ? (
                    <>
                      <span style={{ color: '#FE5C73', display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */ alignItems: 'center', gap: '2px' }}>
                        📈 +{expenseChangePercent.toFixed(1)}%
                      </span>
                      <span style={{ color: 'var(--text-light)', fontWeight: 'normal' }}>{t('vs_last_month')}</span>
                    </>
                  ) : expenseChangePercent < 0 ? (
                    <>
                      <span style={{ color: '#16DBCC', display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */ alignItems: 'center', gap: '2px' }}>
                        📉 {expenseChangePercent.toFixed(1)}%
                      </span>
                      <span style={{ color: 'var(--text-light)', fontWeight: 'normal' }}>{t('vs_last_month')}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-light)', fontWeight: 'normal' }}>{t('no_change_vs_last_month')}</span>
                  )}
                </div>
              )}
            </div>
            <div className="balance-divider"></div>
            <div className="balance-item">
              <div className="balance-label">{t('net_balance')}</div>
              <div className="balance-val" style={{ color: isLoggedIn && displayNet >= 0 ? '#16DBCC' : '#FE5C73' }}>
                {isLoggedIn ? formatCurrency(displayNet) : formatCurrency(0)}
              </div>
            </div>
            <div className="balance-divider"></div>
            <div className="balance-item">
              <div className="balance-label">{t('total_wallet_balance')}</div>
              <div className="balance-val">{isLoggedIn ? formatCurrency(totalBalance) : formatCurrency(0)}</div>
            </div>
          </div>

          {/* AI Cashflow Digest Card */}
          {isLoggedIn && (isLoadingDigest || aiDigest) && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(24, 20, 243, 0.03) 0%, rgba(22, 219, 204, 0.03) 100%)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }} className="hover:shadow-md border-indigo-100 dark:border-slate-800">
              {/* Glowing spot */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: 'rgba(24, 20, 243, 0.06)',
                filter: 'blur(30px)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }} />

              {isLoadingDigest ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }} className="animate-pulse">✨</span>
                    <div style={{ width: '180px', height: '18px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }} className="animate-pulse" />
                  </div>
                  <div style={{ width: '100%', height: '14px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }} className="animate-pulse" />
                  <div style={{ width: '90%', height: '14px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }} className="animate-pulse" />
                  <div style={{ width: '60%', height: '14px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }} className="animate-pulse" />
                </div>
              ) : aiDigest ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px', color: '#1814F3' }}>✨</span>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                        AI Cashflow Digest (Nhận xét Dòng tiền Thông minh)
                      </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        onClick={() => fetchAiDigest(true)}
                        disabled={isLoadingDigest}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '13px',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-light)',
                          outline: 'none'
                        }}
                        className="hover:text-indigo-600 hover:rotate-180 transition-all duration-300 active:scale-95"
                        title="Làm mới nhận xét"
                      >
                        🔄
                      </button>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', background: 'var(--bg-color)', padding: '4px 8px', borderRadius: '12px', fontWeight: '600' }}>
                        Hôm nay
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '14.5px', color: 'var(--text-main)', lineHeight: '1.6', margin: 0 }}>
                    {aiDigest.summary}
                  </p>

                  {aiDigest.insight && (
                    <div style={{
                      background: 'rgba(24, 20, 243, 0.04)',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      borderLeft: '4px solid #1814F3',
                      fontSize: '14px',
                      color: 'var(--text-main)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}>
                      <span style={{ fontSize: '16px', marginTop: '2px' }}>💡</span>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '2px', color: '#1814F3', fontSize: '13px' }}>GỢI Ý TÀI CHÍNH</strong>
                        {aiDigest.insight}
                      </div>
                    </div>
                  )}

                  {aiDigest.suggested_questions && aiDigest.suggested_questions.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Hỏi thêm trợ lý AI:
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {aiDigest.suggested_questions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              startNewChat();
                              setChatOpen(true);
                              setTimeout(() => {
                                sendChatMessage(q);
                              }, 100);
                            }}
                            style={{
                              background: 'var(--card-bg)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '20px',
                              padding: '8px 16px',
                              fontSize: '13px',
                              color: 'var(--text-light)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '500'
                            }}
                            className="hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                          >
                            💬 {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Row 1: Biến động số dư & Thu chi */}
          <div className="row">
            <div className="col-1" style={{ flex: 1 }}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>
                  {t('daily_spending_trend')}
                </h2>

                {/* Visual Toggles */}
                <div style={{ display: 'inline-flex', background: 'var(--border-color)', padding: '3px', borderRadius: '20px', gap: '2px', backdropFilter: 'blur(10px)' }}>
                  {[
                    { key: 'expense', label: 'Chi tiêu', color: '#FE5C73' },
                    { key: 'income', label: 'Thu nhập', color: '#10B981' },
                    { key: 'balance', label: 'Số dư lũy kế', color: '#2D60FF' }
                  ].map(tab => {
                    const isSelected = chartMode === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setChartMode(tab.key as any)}
                        style={{
                          background: isSelected ? 'var(--card-bg)' : 'transparent',
                          color: isSelected ? tab.color : 'var(--text-muted)',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '16px',
                          fontSize: '12px', /* Cỡ chữ 12px */
                          fontWeight: '700', /* Độ đậm chữ 700 (Đậm) */
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="chart-card" style={{
                padding: '24px 30px',
                height: '300px',
                position: 'relative',
                display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */
                flexDirection: 'column',
                justifyContent: 'center', /* Căn giữa các phần tử con theo chiều ngang */
                overflow: 'visible'
              }}>
                {!isLoggedIn || mergedTrends.length === 0 ? (
                  <div style={{ display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */ flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '20px 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '36px' }}>📈</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '600', /* Độ đậm chữ 600 (Vừa) */ fontSize: '14px' }}>
                      {isLoadingDailyTrends ? t('loading') : t('no_transaction_data')}
                    </span>
                    <span style={{ color: 'var(--text-light)', fontSize: '11px', /* Cỡ chữ 11px */ maxWidth: '300px' }}>
                      {isLoadingDailyTrends ? t('syncing_chart') : t('no_spending_in_period')}
                    </span>
                  </div>
                ) : (
                  (() => {
                    const processedDailyTrends: any[] = [];
                    let runningBalance = 0;

                    mergedTrends.forEach((trend) => {
                      const inc = Number(trend.income) || 0;
                      const exp = Number(trend.expense) || 0;
                      const net = inc - exp;
                      runningBalance += net;

                      processedDailyTrends.push({
                        day: trend.label.split('/')[0],
                        label: trend.label,
                        expense: exp,
                        income: inc,
                        balance: runningBalance,
                        value: chartMode === 'expense'
                          ? exp
                          : chartMode === 'income'
                            ? inc
                            : runningBalance
                      });
                    });

                    const minY = Math.min(...processedDailyTrends.map(t => t.value), 0);
                    const maxY = Math.max(...processedDailyTrends.map(t => t.value), 100000);
                    const valRange = maxY - minY || 1;

                    const getX = (idx: number) => {
                      const len = processedDailyTrends.length;
                      if (len <= 1) return 450;
                      return (idx / (len - 1)) * 900;
                    };
                    const getY = (val: number) => 170 - ((val - minY) / valRange) * 135;

                    const points = processedDailyTrends.map((t, idx) => ({
                      x: getX(idx),
                      y: getY(t.value)
                    }));

                    let dPath = '';
                    if (points.length > 0) {
                      dPath = points.reduce((acc, p, idx, arr) => {
                        if (idx === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
                        const prev = arr[idx - 1];
                        const prevPrev = arr[idx - 2] || prev;
                        const next = arr[idx + 1] || p;

                        const cp1x = prev.x + (p.x - prev.x) / 3;
                        let cp1y = prev.y + (p.y - prevPrev.y) / 6;

                        const cp2x = p.x - (p.x - prev.x) / 3;
                        let cp2y = p.y + (next.y - prev.y) / 6;

                        const ctrlMinY = Math.min(prev.y, p.y);
                        const ctrlMaxY = Math.max(prev.y, p.y);
                        cp1y = Math.max(ctrlMinY, Math.min(ctrlMaxY, cp1y));
                        cp2y = Math.max(ctrlMinY, Math.min(ctrlMaxY, cp2y));

                        return `${acc} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
                      }, "");
                    }

                    const dArea = points.length > 0
                      ? `${dPath} L ${points[points.length - 1].x.toFixed(1)} 170 L ${points[0].x.toFixed(1)} 170 Z`
                      : '';

                    let chartColor = '#FF6B81';
                    let gradId = 'expenseGrad';
                    let glowId = 'glow';

                    if (chartMode === 'income') {
                      chartColor = '#10B981';
                      gradId = 'incomeGrad';
                      glowId = 'glowIncome';
                    } else if (chartMode === 'balance') {
                      chartColor = '#2D60FF';
                      gradId = 'balanceGrad';
                      glowId = 'glowBalance';
                    }

                    return (
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <svg viewBox="0 0 900 210" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                          <defs>
                            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FF6B81" stopOpacity="0.45" />
                              <stop offset="50%" stopColor="#FF6B81" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#FF6B81" stopOpacity="0.00" />
                            </linearGradient>
                            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                              <stop offset="50%" stopColor="#10B981" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
                            </linearGradient>
                            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2D60FF" stopOpacity="0.45" />
                              <stop offset="50%" stopColor="#2D60FF" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#2D60FF" stopOpacity="0.00" />
                            </linearGradient>

                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#FF6B81" floodOpacity="0.3" />
                            </filter>
                            <filter id="glowIncome" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10B981" floodOpacity="0.3" />
                            </filter>
                            <filter id="glowBalance" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2D60FF" floodOpacity="0.3" />
                            </filter>
                          </defs>

                          <g stroke="var(--border-color)" strokeWidth="1" opacity="0.8">
                            <line x1="0" y1="35" x2="900" y2="35" strokeDasharray="4 4" />
                            <line x1="0" y1="80" x2="900" y2="80" strokeDasharray="4 4" />
                            <line x1="0" y1="125" x2="900" y2="125" strokeDasharray="4 4" />
                            <line x1="0" y1="170" x2="900" y2="170" strokeWidth="1.5" />

                            {processedDailyTrends.filter((_, idx) => idx % 5 === 0 || idx === processedDailyTrends.length - 1).map((item, idx) => {
                              const x = getX(processedDailyTrends.indexOf(item));
                              return (
                                <line
                                  key={idx}
                                  x1={x}
                                  y1="35"
                                  x2={x}
                                  y2="170"
                                  strokeDasharray="4 4"
                                  opacity="0.4"
                                />
                              );
                            })}
                          </g>

                          <path d={dArea} fill={`url(#${gradId})`} />
                          <path d={dPath} fill="none" stroke={chartColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`} />

                          {chartMode !== 'balance' && processedDailyTrends.map((t, idx) => {
                            if (t.value === 0) return null;
                            return (
                              <circle
                                key={idx}
                                cx={getX(idx)}
                                cy={getY(t.value)}
                                r="4"
                                fill={chartColor}
                                stroke="var(--card-bg)"
                                strokeWidth="1.5"
                                style={{ filter: `drop-shadow(0px 1px 3px ${chartColor}60)` }}
                                pointerEvents="none"
                              />
                            );
                          })}

                          {hoveredDailyPoint !== null && (
                            <line
                              x1={getX(hoveredDailyPoint as number)}
                              y1="35"
                              x2={getX(hoveredDailyPoint as number)}
                              y2="170"
                              stroke={chartColor}
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                              opacity="0.8"
                              pointerEvents="none"
                            />
                          )}

                          {hoveredDailyPoint !== null && (
                            <circle
                              cx={getX(hoveredDailyPoint as number)}
                              cy={getY(processedDailyTrends[hoveredDailyPoint as number].value)}
                              r="6"
                              fill={chartColor}
                              stroke="#fff"
                              strokeWidth="2.5"
                              style={{ filter: `drop-shadow(0px 2px 6px ${chartColor}80)` }}
                              pointerEvents="none"
                            />
                          )}

                          {processedDailyTrends.map((_, idx) => (
                            <rect
                              key={idx}
                              x={getX(idx) - 450 / (processedDailyTrends.length - 1)}
                              y="0"
                              width={900 / (processedDailyTrends.length - 1)}
                              height="170"
                              fill="transparent"
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={() => setHoveredDailyPoint(idx)}
                              onMouseLeave={() => setHoveredDailyPoint(null)}
                            />
                          ))}

                          {processedDailyTrends.filter((_, idx) => idx % 5 === 0 || idx === processedDailyTrends.length - 1).map((item, idx) => {
                            const actualIdx = processedDailyTrends.indexOf(item);
                            const x = getX(actualIdx);
                            const isFirst = actualIdx === 0;
                            const isLast = actualIdx === processedDailyTrends.length - 1;
                            const textAnchor = isFirst ? "start" : isLast ? "end" : "middle";
                            return (
                              <text
                                key={idx}
                                x={x}
                                y="195"
                                textAnchor={textAnchor}
                                fill="var(--text-light)"
                                fontSize="11"
                                fontWeight="600"
                              >
                                {trendsGroupBy === 'day' ? `${t('day_label')} ${item.day}` : `${t('month_label_prefix')} ${item.day}`}
                              </text>
                            );
                          })}

                          {hoveredDailyPoint !== null && (() => {
                            const item = processedDailyTrends[hoveredDailyPoint as number];
                            const xVal = getX(hoveredDailyPoint as number);
                            const yVal = getY(item.value);

                            const tooltipWidth = 150;
                            const tooltipHeight = 52;

                            let tx = xVal - tooltipWidth / 2;
                            if (tx < 10) tx = 10;
                            if (tx + tooltipWidth > 890) tx = 890 - tooltipWidth;

                            const showBelow = yVal < 75;
                            const ty = showBelow ? yVal + 15 : yVal - tooltipHeight - 15;

                            let amtStr = '';
                            if (chartMode === 'expense') {
                              amtStr = `-${formatCurrency(item.expense)}`;
                            } else if (chartMode === 'income') {
                              amtStr = `+${formatCurrency(item.income)}`;
                            } else {
                              amtStr = `${item.balance >= 0 ? '+' : ''}${formatCurrency(item.balance)}`;
                            }

                            return (
                              <g pointerEvents="none">
                                <rect
                                  x={tx}
                                  y={ty}
                                  width={tooltipWidth}
                                  height={tooltipHeight}
                                  rx="8"
                                  ry="8"
                                  fill="#0F172A"
                                  opacity="0.95"
                                  stroke="rgba(255, 255, 255, 0.15)"
                                  strokeWidth="1.2"
                                  style={{ filter: 'drop-shadow(0px 6px 16px rgba(0,0,0,0.35))' }}
                                />
                                <text
                                  x={tx + tooltipWidth / 2}
                                  y={ty + 20}
                                  textAnchor="middle"
                                  fill="#94A3B8"
                                  fontSize="10"
                                  fontWeight="500"
                                >
                                  {trendsGroupBy === 'day' ? `${t('day_label')} ${item.label}` : `${t('month_label_prefix')} ${item.label}`}
                                </text>
                                <text
                                  x={tx + tooltipWidth / 2}
                                  y={ty + 38}
                                  textAnchor="middle"
                                  fill={chartColor}
                                  fontSize="13"
                                  fontWeight="700"
                                >
                                  {amtStr}
                                </text>
                              </g>
                            );
                          })()}
                        </svg>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>

          {/* Hàng 2: Phân bổ chi tiêu & Top 5 danh mục */}
          <div className="row" style={{ marginTop: '24px' }}>
            <div className="col-1" style={{ flex: 1 }}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="section-title">{t('expense_allocation')}</h2>
                {isLoggedIn && categoryData.length > 0 && (
                  <div style={{
                    display: 'flex',
                    background: 'var(--bg-color)',
                    padding: '3px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    alignItems: 'center',
                  }}>
                    <button
                      onClick={() => setAllocationType('parent')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '16px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: allocationType === 'parent' ? 'var(--card-bg)' : 'transparent',
                        color: allocationType === 'parent' ? 'var(--text-main)' : 'var(--text-light)',
                        boxShadow: allocationType === 'parent' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                    >
                      {t('parent') || 'Cha'}
                    </button>
                    <button
                      onClick={() => setAllocationType('child')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '16px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: allocationType === 'child' ? 'var(--card-bg)' : 'transparent',
                        color: allocationType === 'child' ? 'var(--text-main)' : 'var(--text-light)',
                        boxShadow: allocationType === 'child' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                    >
                      {t('child') || 'Con'}
                    </button>
                  </div>
                )}
              </div>
              <div className="chart-card" style={{ display: 'flex', flexDirection: 'row', gap: '30px', alignItems: 'center', padding: '24px 30px', height: '280px' }}>
                {!isLoggedIn || categoryData.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '20px 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '36px' }}>📊</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' }}>
                      {isLoadingCategory ? t('loading') : t('no_data')}
                    </span>
                    <span style={{ color: 'var(--text-light)', fontSize: '11px', maxWidth: '200px' }}>
                      {isLoadingCategory ? t('syncing_chart') : t('no_spending_in_period')}
                    </span>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const activeIdx = hoveredCategory !== null ? hoveredCategory : selectedCategoryIdx;
                      const activeData = processedCategoryData[activeIdx] || null;

                      return (
                        <>
                          <div style={{
                            position: 'relative',
                            width: '160px',
                            height: '160px',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <svg viewBox="0 0 100 100" style={{ width: '160px', height: '160px', transform: 'rotate(-90deg)', overflow: 'visible' }}>
                              <circle
                                cx="50"
                                cy="50"
                                r="38"
                                fill="transparent"
                                stroke="var(--border-color)"
                                strokeWidth="8"
                                opacity="0.15"
                              />
                              {(() => {
                                let accumulatedFraction = 0;
                                return processedCategoryData.map((cat, idx) => {
                                  const isSelected = activeIdx === idx;
                                  const r = isSelected ? 41 : 38;
                                  const strokeWidth = isSelected ? 12 : 8;
                                  const c = 2 * Math.PI * r;
                                  const segmentLength = (cat.percentage / 100) * c;
                                  const strokeDashArray = `${segmentLength} ${c}`;
                                  const strokeDashOffset = - (accumulatedFraction * c);
                                  accumulatedFraction += (cat.percentage / 100);

                                  return (
                                    <circle
                                      key={idx}
                                      cx="50"
                                      cy="50"
                                      r={r}
                                      fill="transparent"
                                      stroke={cat.category_color || '#718EBF'}
                                      strokeWidth={strokeWidth}
                                      strokeDasharray={strokeDashArray}
                                      strokeDashoffset={strokeDashOffset}
                                      opacity={activeIdx === null || isSelected ? 1 : 0.4}
                                      style={{
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer',
                                      }}
                                      onMouseEnter={() => setHoveredCategory(idx)}
                                      onMouseLeave={() => setHoveredCategory(null)}
                                      onClick={() => setSelectedCategoryIdx(idx)}
                                    />
                                  );
                                });
                              })()}
                            </svg>

                            <div style={{
                              position: 'absolute',
                              left: '50%',
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              pointerEvents: 'none',
                              textAlign: 'center',
                              width: '95px',
                            }}>
                              <span style={{
                                fontSize: '10px',
                                color: activeData ? activeData.category_color || 'var(--text-light)' : 'var(--text-light)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: '700',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                width: '100%',
                                transition: 'color 0.2s ease'
                              }}>
                                {activeData ? (activeData.category_name === 'uncategorized' ? 'Chưa phân loại' : activeData.category_name) : t('spending')}
                              </span>
                              <span style={{
                                fontSize: '13px',
                                fontWeight: '800',
                                color: 'var(--text-main)',
                                width: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginTop: '2px',
                                transition: 'all 0.2s ease'
                              }}>
                                {formatCurrency(activeData ? activeData.amount : totalCategoryExpense)}
                              </span>
                              {activeData && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  color: 'var(--text-light)',
                                  marginTop: '2px'
                                }}>
                                  {activeData.percentage}%
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            maxHeight: '230px',
                            overflowY: 'auto',
                            paddingRight: '6px'
                          }}>
                            {processedCategoryData.map((cat, idx) => {
                              const isSelected = activeIdx === idx;
                              return (
                                <div
                                  key={idx}
                                  onMouseEnter={() => setHoveredCategory(idx)}
                                  onMouseLeave={() => setHoveredCategory(null)}
                                  onClick={() => {
                                    setSelectedCategoryIdx(idx);
                                    handleOpenCategoryTransactions(cat);
                                  }}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    padding: '10px 12px',
                                    borderRadius: '16px',
                                    background: isSelected
                                      ? (cat.category_color ? `${cat.category_color}0A` : 'var(--border-color)')
                                      : 'transparent',
                                    border: isSelected
                                      ? `1.5px solid ${cat.category_color || '#718EBF'}`
                                      : '1.5px solid transparent',
                                    boxShadow: isSelected ? '0 4px 12px rgba(0, 0, 0, 0.03)' : 'none',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: isSelected ? 'translateX(2px)' : 'none',
                                    minWidth: 0
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                      <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '10px',
                                        background: cat.category_color ? `${cat.category_color}1A` : 'rgba(113, 142, 191, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        flexShrink: 0,
                                      }}>
                                        {parseIcon(cat.category_icon) || '📁'}
                                      </div>
                                      <span style={{
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        color: 'var(--text-main)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1
                                      }}>
                                        {cat.category_name === 'uncategorized' ? 'Chưa phân loại' : cat.category_name}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                      <span style={{
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        color: 'var(--text-main)',
                                      }}>
                                        {formatCurrency(cat.amount)}
                                      </span>
                                      <span style={{
                                        color: isSelected ? (cat.category_color || '#718EBF') : 'var(--text-light)',
                                        fontSize: '15px',
                                        fontWeight: '800',
                                        marginLeft: '4px',
                                        transition: 'color 0.2s ease'
                                      }}>
                                        ›
                                      </span>
                                    </div>
                                  </div>
                                  <div style={{
                                    width: '100%',
                                    height: isSelected ? '6px' : '4px',
                                    background: 'var(--border-color)',
                                    borderRadius: '3px',
                                    marginTop: '6px',
                                    overflow: 'hidden',
                                    position: 'relative'
                                  }}>
                                    <div style={{
                                      width: `${cat.percentage}%`,
                                      height: '100%',
                                      background: cat.category_color || '#718EBF',
                                      borderRadius: '3px',
                                      transition: 'width 0.4s ease-in-out'
                                    }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>

            <div className="col-1" style={{ flex: 1 }}>
              <div className="section-header">
                <h2 className="section-title">
                  {t('top_categories') || 'Top 5 danh mục chi tiêu nhiều nhất'}
                </h2>
              </div>
              <div className="chart-card" style={{
                padding: '20px 24px',
                height: '280px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {!isLoggedIn || top5Categories.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '20px 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '36px' }}>🏆</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' }}>
                      {isLoadingCategory ? t('loading') : t('no_data')}
                    </span>
                    <span style={{ color: 'var(--text-light)', fontSize: '11px', maxWidth: '200px' }}>
                      {isLoadingCategory ? t('syncing_chart') : t('no_spending_in_period')}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    {top5Categories.map((cat, idx) => (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredTopCategory(idx)}
                        onMouseLeave={() => setHoveredTopCategory(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '6px 8px',
                          borderRadius: '12px',
                          background: hoveredTopCategory === idx ? 'var(--border-color)' : 'transparent',
                          transform: hoveredTopCategory === idx ? 'translateX(4px)' : 'none',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--text-light)',
                          width: '16px',
                          textAlign: 'center',
                          flexShrink: 0,
                        }}>
                          #{idx + 1}
                        </span>

                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          background: cat.category_color ? `${cat.category_color}15` : 'rgba(113, 142, 191, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          flexShrink: 0,
                        }}>
                          {parseIcon(cat.category_icon) || '📁'}
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, gap: '2px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: 'var(--text-main)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}>
                              {cat.category_name === 'uncategorized' ? 'Chưa phân loại' : cat.category_name}
                            </span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: 'var(--text-main)',
                              flexShrink: 0,
                            }}>
                              {formatCurrency(cat.amount)}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ flex: 1, height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${cat.percentage}%`,
                                height: '100%',
                                background: cat.category_color || '#718EBF',
                                borderRadius: '2px'
                              }} />
                            </div>
                            <span style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-light)', width: '24px', textAlign: 'right', flexShrink: 0 }}>
                              {cat.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hàng 3: 3 cột đối xứng bằng nhau (Giao dịch gần đây + Ngân sách + Ví của tôi) */}
          <div className="row" style={{ marginTop: '24px' }}>
            <div className="col-1" style={{ flex: 1 }}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="section-title">{t('recent_transactions')}</h2>
                {isLoggedIn && (
                  <Link href="/transactions" style={{ fontSize: '13px', color: '#1814F3', fontWeight: '600', textDecoration: 'none' }}>
                    {t('details') || 'Chi tiết'}
                  </Link>
                )}
              </div>
              <div className="transactions-card" style={{ height: 'auto', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '16px' }}>
                {!isLoggedIn || filteredRecentTransactions.length === 0 ? (
                  <div style={{ padding: '30px 20px', textAlign: 'center', color: '#718EBF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                    <span style={{ fontSize: '32px' }}>💸</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '14px' }}>{t('no_transactions')}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', maxWidth: '240px' }}>{t('first_transaction_prompt')}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {filteredRecentTransactions.slice(0, 4).map((x, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderBottom: i === filteredRecentTransactions.slice(0, 4).length - 1 ? 'none' : '1px solid var(--border-color)',
                          background: 'var(--card-bg)',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: x.type === 'expense' ? 'rgba(254, 92, 115, 0.1)' : 'rgba(22, 219, 204, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            flexShrink: 0
                          }}>
                            {x.type === 'expense' ? '💸' : '💰'}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{
                              fontWeight: '600',
                              fontSize: '12px',
                              color: 'var(--text-main)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {x.title || x.desc || x.notes || t('other')}
                            </div>
                            <div style={{ fontSize: '9px', color: 'var(--text-light)', marginTop: '2px' }}>
                              {formatDate(x.transaction_date)} • {x.category?.name || 'Không có danh mục'}
                            </div>
                          </div>
                        </div>
                        <div className="tx-amount" style={{ color: x.type === 'expense' || x.amount < 0 ? '#FE5C73' : '#16DBCC', fontSize: '12px', fontWeight: '700' }}>
                          {x.type === 'expense' || x.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(parseFloat(x.amount || 0)))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="col-1" style={{ flex: 1 }}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="section-title">{t('budget')}</h2>
                {isLoggedIn && budgetsList.length > 0 && (
                  <Link href="/budget" style={{ fontSize: '13px', color: '#1814F3', fontWeight: '600', textDecoration: 'none' }}>
                    {t('details') || 'Chi tiết'}
                  </Link>
                )}
              </div>
              <div className="transactions-card" style={{ height: 'auto', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
                {isLoadingBudget ? (
                  <div style={{ textAlign: 'center', color: '#718EBF' }}>{t('loading')}</div>
                ) : !isLoggedIn ? (
                  <div style={{ textAlign: 'center', color: '#718EBF' }}>
                    <p style={{ marginBottom: '10px' }}>{t('please_login')}</p>
                    <Link href="/login" style={{ textDecoration: 'none', color: '#fff', background: '#343C6A', padding: '6px 12px', borderRadius: '15px', fontWeight: 'bold', fontSize: '13px' }}>{t('login')}</Link>
                  </div>
                ) : budgetsList.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#718EBF' }}>
                    <p style={{ fontSize: '14px', margin: 0 }}>{t('no_budget_set')}</p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                      <Link href="/budget" style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: '#1814F3',
                        color: '#fff',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '13px',
                      }}>
                        {t('set_budget')}
                      </Link>
                      <button
                        onClick={handleCopyBudgets}
                        disabled={isLoadingBudget}
                        style={{
                          padding: '8px 16px',
                          background: 'transparent',
                          color: '#1814F3',
                          borderRadius: '10px',
                          border: '1px solid #1814F3',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        {t('copy_from_previous_month')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '15px' }}>
                        {overallBudget ? t('total_monthly_budget') : (t('category_budgets') || 'Ngân sách danh mục')}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: totalPct >= 100 ? '#FE5C73' : totalPct >= 80 ? '#FF9800' : '#16DBCC' }}>
                        {totalPct}%
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '12px', background: 'var(--bg-color)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(totalPct, 100)}%`,
                        height: '100%',
                        background: totalPct >= 100 ? '#FE5C73' : totalPct >= 80 ? '#FF9800' : '#16DBCC',
                        borderRadius: '6px',
                        transition: 'width 0.6s ease-in-out'
                      }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#718EBF' }}>
                      <div>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{formatCurrency(totalUsed)}</span>
                        <span> / {formatCurrency(totalLimit)}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', marginTop: '2px' }}>
                      {totalUsed > totalLimit ? (
                        <span style={{ color: '#FE5C73', fontWeight: '600' }}>
                          🚨 {t('over_budget') || 'Vượt ngân sách!'} ({formatCurrency(totalUsed - totalLimit)})
                        </span>
                      ) : (
                        <span style={{ color: '#16DBCC', fontWeight: '600' }}>
                          ✓ {t('remaining_label') || 'Còn lại:'} {formatCurrency(totalLimit - totalUsed)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-1" style={{ flex: 1 }}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="section-title">{t('wallets')}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setShowWalletBalance(!showWalletBalance)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718EBF', display: 'flex', alignItems: 'center', padding: '5px' }}
                    title={showWalletBalance ? t('hide_balance') : t('show_balance')}
                  >
                    {showWalletBalance ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    )}
                  </button>
                  {isLoggedIn && (
                    <Link href="/wallets" style={{ fontSize: '13px', color: '#1814F3', fontWeight: '600', textDecoration: 'none' }}>
                      {t('details') || 'Chi tiết'}
                    </Link>
                  )}
                </div>
              </div>
              <div className="transactions-card" style={{ height: 'auto', minHeight: '280px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                {isLoadingWallets ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>{t('loading')}</div>
                ) : !isLoggedIn || wallets.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#718EBF' }}>{t('no_wallets')}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {wallets.slice(0, 3).map((w, i) => {
                      const walletTypeMap: Record<string, { icon: string; label: string; gradient: string }> = {
                        cash: { icon: '💵', label: t('cash') || 'Tiền mặt', gradient: 'linear-gradient(135deg, #16DBCC, #0BB5A7)' },
                        bank: { icon: '🏦', label: t('bank') || 'Ngân hàng', gradient: 'linear-gradient(135deg, #1814F3, #396AFF)' },
                        ewallet: { icon: '📱', label: t('ewallet') || 'Ví điện tử', gradient: 'linear-gradient(135deg, #FF6B81, #FE5C73)' },
                      };
                      const wType = walletTypeMap[w.type] || walletTypeMap['bank'];
                      const walletColor = w.color || '#396AFF';

                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: '14px',
                            background: 'var(--bg-color)',
                            border: '1px solid var(--border-color)',
                            position: 'relative',
                            overflow: 'hidden', /* Ẩn mọi phần nội dung tràn ra ngoài */
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.transform = 'none';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                          }}
                        >
                          {/* Left accent stripe */}
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            background: walletColor,
                            borderRadius: '14px 0 0 14px'
                          }} />

                          {/* Icon */}
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */
                            alignItems: 'center', /* Căn các phần tử con giữa theo chiều dọc */
                            justifyContent: 'center', /* Căn giữa các phần tử con theo chiều ngang */
                            fontSize: '20px', /* Cỡ chữ 20px */
                            background: `${walletColor}15`,
                            flexShrink: 0, /* Không cho phép co bóp kích thước */
                          }}>
                            {parseIcon(w.icon) || wType.icon} {/* Hiển thị emoji biểu tượng của ví */}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontWeight: '700', /* Độ đậm chữ 700 (Đậm) */
                              fontSize: '13px', /* Cỡ chữ 13px */
                              color: 'var(--text-main)', /* Màu chữ chính của theme */
                              overflow: 'hidden', /* Ẩn mọi phần nội dung tràn ra ngoài */
                              textOverflow: 'ellipsis', /* Hiển thị dấu ba chấm (...) khi chữ tràn */
                              whiteSpace: 'nowrap', /* Không cho xuống dòng tự động */
                            }}>
                              {w.name || t('main_account')} {/* Hiển thị tên ví, mặc định là Tài khoản chính */}
                            </div>
                            <div style={{
                              display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */
                              alignItems: 'center', /* Căn các phần tử con giữa theo chiều dọc */
                              gap: '6px', /* Khoảng cách giãn giữa các con là 6px */
                              marginTop: '3px', /* Khoảng cách lề ngoài phía trên 3px */
                            }}>
                              <span style={{
                                fontSize: '10px', /* Cỡ chữ 10px */
                                fontWeight: '600', /* Độ đậm chữ 600 (Vừa) */
                                color: walletColor, /* Màu chủ đạo của loại ví */
                                background: `${walletColor}15`,
                                padding: '1px 6px', /* Khoảng cách đệm trong 1px dọc và 6px ngang */
                                borderRadius: '6px', /* Bo góc các cạnh 6px */
                                textTransform: 'uppercase', /* Chuyển thành chữ IN HOA */
                                letterSpacing: '0.3px'
                              }}>
                                {wType.label} {/* Hiển thị nhãn phân loại ví (ví dụ: ngân hàng, tiền mặt) */}
                              </span>

                            </div>
                          </div>

                          {/* Balance */}
                          <div style={{
                            fontWeight: '800', /* Độ đậm chữ 800 (Rất đậm) */
                            fontSize: '13px', /* Cỡ chữ 13px */
                            color: 'var(--text-main)', /* Màu chữ chính của theme */
                            flexShrink: 0, /* Không cho phép co bóp kích thước */
                            textAlign: 'right', /* Căn chữ sang lề phải */
                          }}>
                            {showWalletBalance ? formatCurrency(parseFloat(w.available_balance)) : '••••••'} {/* Hiển thị số tiền số dư ví hoặc che đi bằng dấu chấm */}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Category Transactions Modal */}
      {transactionModalCategory && (
        <div className="dashboard-modal-overlay" onClick={() => setTransactionModalCategory(null)}>
          <div className="dashboard-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <div className="dashboard-modal-header-info">
                <div>
                  <h3 className="dashboard-modal-title">Chi tiết chi tiêu</h3>
                  <div className="dashboard-modal-subtitle">
                    {timePeriod === 'custom'
                      ? `${activeStartDate} - ${activeEndDate}`
                      : timePeriod === 'week' ? 'Tuần này'
                        : timePeriod === 'month' ? 'Tháng này'
                          : timePeriod === 'quarter' ? 'Quý này' : 'Năm nay'}
                    {selectedWalletId && ` • ${wallets.find(w => w.id === selectedWalletId)?.name || 'Ví của tôi'}`}
                  </div>
                </div>
              </div>
              <button className="dashboard-modal-close" onClick={() => setTransactionModalCategory(null)}>
                &times;
              </button>
            </div>

            <div className="dashboard-modal-body">
              {/* Category Info Banner */}
              <div className="dashboard-modal-category-card">
                <div className="dashboard-modal-category-title-area">
                  <div
                    className="dashboard-modal-category-icon-box"
                    style={{
                      background: transactionModalCategory.category_color ? `${transactionModalCategory.category_color}1A` : 'rgba(113, 142, 191, 0.1)',
                      color: transactionModalCategory.category_color || '#718EBF'
                    }}
                  >
                    {parseIcon(transactionModalCategory.category_icon) || '📁'}
                  </div>
                  <div className="dashboard-modal-category-details">
                    <h4>{transactionModalCategory.category_name === 'uncategorized' ? 'Chưa phân loại' : transactionModalCategory.category_name}</h4>
                    <span>{modalTransactions.length} giao dịch</span>
                  </div>
                </div>
                <div className="dashboard-modal-category-amount" style={{ color: '#FE5C73' }}>
                  -{formatCurrency(transactionModalCategory.amount)}
                </div>
              </div>

              {/* Transactions List */}
              {isLoadingModalTransactions ? (
                <div style={{ display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px' }}>
                  <div className="spinner" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '3px solid var(--border-color)',
                    borderTopColor: 'var(--active-blue)',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '600', /* Độ đậm chữ 600 (Vừa) */ }}>
                    Đang tải danh sách giao dịch...
                  </span>
                </div>
              ) : modalTransactions.length === 0 ? (
                <div style={{ display: 'flex', /* Hiển thị dạng hộp Flexbox linh hoạt */ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '40px' }}>💸</span>
                  <span style={{ fontWeight: '700', /* Độ đậm chữ 700 (Đậm) */ fontSize: '14px', color: 'var(--text-main)' }}>Không tìm thấy giao dịch nào</span>
                  <span style={{ fontSize: '11px', /* Cỡ chữ 11px */ color: 'var(--text-light)', maxWidth: '240px' }}>
                    Không có giao dịch ghi chép chi tiêu nào thuộc danh mục này trong khoảng thời gian đã chọn.
                  </span>
                </div>
              ) : (
                <div>
                  {modalTransactions.map((tx: any) => {
                    const txDate = new Date(tx.transaction_date);
                    const day = txDate.getDate();
                    const monthStr = `T${txDate.getMonth() + 1}`;
                    const timeStr = txDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    const walletName = wallets.find(w => w.id === tx.wallet_id)?.name || 'Tài khoản chính';

                    return (
                      <div key={tx.id} className="dashboard-modal-tx-item">
                        <div className="dashboard-modal-tx-info">
                          <div className="dashboard-modal-tx-date-badge">
                            <span className="dashboard-modal-tx-date-day">{day}</span>
                            <span className="dashboard-modal-tx-date-month">{monthStr}</span>
                          </div>
                          <div className="dashboard-modal-tx-text">
                            <h5 className="dashboard-modal-tx-title" title={tx.title || tx.notes || 'Giao dịch'}>
                              {tx.title || tx.notes || 'Giao dịch'}
                            </h5>
                            <div className="dashboard-modal-tx-sub">
                              <span>{timeStr}</span>
                              <span>•</span>
                              <span className="dashboard-modal-tx-wallet-tag">{walletName}</span>
                              {tx.notes && (
                                <>
                                  <span>•</span>
                                  <span style={{ fontStyle: 'italic' }}>{tx.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="dashboard-modal-tx-amount expense">
                          -{formatCurrency(tx.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} // Kết thúc kiểm tra điều kiện dữ liệu
