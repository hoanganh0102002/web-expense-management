"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { useAppContext } from '../context/AppContext';
import { authApi } from './api';

const translations: Record<string, Record<string, string>> = {
  vi: {
    // Sidebar & Navigation
    categories: "Danh mục",
    wallets: "Ví của tôi",
    transactions: "Giao dịch",
    dashboard: "Tổng quan",
    investments: "Đầu tư",
    loans: "Vay nợ",
    budget: "Ngân sách",
    reports: "Báo cáo",
    settings: "Cài đặt",
    notifications: "Thông báo",
    login: "Đăng nhập",
    logout: "Đăng xuất",
    new_user: "Người dùng mới",

    // Common Actions
    add_new_category: "+ Tạo danh mục mới",
    edit: "Sửa",
    delete: "Xóa",
    done: "Xong",
    confirm: "Xác nhận",
    cancel: "Hủy",
    save_changes: "Lưu thay đổi",
    saving: "Đang lưu...",
    cancel_changes: "Hủy bỏ",
    search: "Tìm kiếm",
    search_placeholder: "Tìm kiếm...",
    loading: "Đang tải...",
    download: "Tải xuống",
    reload: "Tải lại",
    all: "Tất cả",

    // Categories Page
    category_name: "Tên danh mục",
    parent_category: "Thuộc danh mục",
    select: "Chọn",
    icon: "Biểu tượng",
    change_icon: "Đổi biểu tượng",
    delete_confirm_msg: "Bạn có chắc chắn muốn xóa danh mục này?",
    create_success: "Tạo danh mục thành công!",
    delete_success: "Đã xóa danh mục!",
    spending: "Chi tiêu",
    income: "Thu nhập",
    transactions_count: "giao dịch",
    sub_categories: "Danh mục con",
    management: "Quản lý",
    category_management: "Quản lý danh mục",

    // Dashboard Page
    total_income: "Tổng thu nhập",
    total_expense: "Tổng chi tiêu",
    net_balance: "Số dư ròng",
    total_wallet_balance: "Tổng số dư ví",
    income_vs_expense: "Thu nhập vs Chi tiêu",
    daily_spending_trend: "Xu hướng chi tiêu hàng ngày",
    top_categories: "Top 5 danh mục chi tiêu nhiều nhất",
    vs_last_month: "so với tháng trước",
    no_change_vs_last_month: "Không đổi so với tháng trước",
    this_week: "Tuần này",
    this_month: "Tháng này",
    this_quarter: "Quý này",
    this_year: "Năm này",
    custom_period: "Tùy chỉnh",
    expense_allocation: "Phân bổ chi tiêu",
    recent_transactions: "Giao dịch gần đây",
    no_transactions: "Không có giao dịch nào",
    no_data: "Chưa có dữ liệu",
    no_transaction_data: "Chưa có dữ liệu giao dịch",
    syncing_chart: "Đang đồng bộ biểu đồ...",
    add_report: "+ Thêm báo cáo",
    main_account: "Tài khoản chính",
    developing_budget: "Đang phát triển tính năng ngân sách",
    no_wallets: "Chưa có ví nào",

    // Settings Page
    settings_customize: "Cài đặt & Tùy chỉnh",
    personal_info: "Thông tin cá nhân",
    display_options: "Tùy chọn hiển thị",
    security: "Bảo mật",
    full_name: "Họ tên",
    email: "Email",
    phone: "Số điện thoại",
    address: "Địa chỉ",
    not_updated: "Chưa cập nhật",
    email_not_verified: "Email chưa xác thực",
    enter_placeholder: "Nhập",
    please_login: "Vui lòng đăng nhập",
    currency_label: "Đơn vị tiền tệ",
    language_label: "Ngôn ngữ",
    dark_mode: "Chế độ tối (Dark Mode)",
    dark_mode_desc: "Giảm mỏi mắt và tiết kiệm pin trên màn hình OLED",
    save_preferences: "Lưu tùy chọn",
    account_security: "Bảo mật tài khoản",
    current_password: "Mật khẩu hiện tại",
    new_password: "Mật khẩu mới",
    confirm_new_password: "Xác nhận mật khẩu mới",
    enter_new_password: "Nhập mật khẩu mới...",
    confirm_password_again: "Nhập lại mật khẩu mới...",
    update_password: "Cập nhật mật khẩu",
    updating: "Đang cập nhật...",
    revoke_all_devices: "Thu hồi tất cả thiết bị",
    delete_account: "Xóa tài khoản",
    delete_account_warning: "Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu giao dịch và ví của bạn.",
    delete_account_now: "Xóa tài khoản ngay",
    update_success: "Cập nhật thành công!",
    avatar_update_success: "Cập nhật ảnh đại diện thành công!",
    fill_all_password: "Vui lòng điền đầy đủ thông tin mật khẩu!",
    password_mismatch: "Mật khẩu mới và xác nhận mật khẩu không khớp!",
    password_change_success: "Đổi mật khẩu thành công! Bạn sẽ được đăng xuất để bảo mật.",
    delete_confirm_1: "BẠN CÓ CHẮC CHẮN MUỐN XÓA TÀI KHOẢN? Hành động này không thể hoàn tác và toàn bộ dữ liệu giao dịch, ví tiền sẽ bị xóa sạch.",
    delete_confirm_2: "XÁC NHẬN LẦN CUỐI: Bạn thực sự muốn xóa vĩnh viễn tài khoản SpendWise chứ?",
    account_deleted: "Tài khoản của bạn đã được xóa vĩnh viễn khỏi hệ thống.",
    error_prefix: "Lỗi: ",
    delete_error: "Lỗi khi xóa tài khoản: ",

    // Reports Page
    reports_export: "Báo cáo & Xuất dữ liệu",
    export_pdf: "Xuất PDF",
    export_pdf_desc: "Bảng tổng hợp thu chi kèm biểu đồ",
    export_excel: "Xuất Excel",
    export_excel_desc: "Toàn bộ giao dịch dạng bảng tính",
    export_csv: "Xuất CSV",
    export_csv_desc: "Dữ liệu thô để import vào app khác",
    filter_before_export: "Bộ lọc trước khi xuất",
    from_date: "Từ ngày",
    to_date: "Đến ngày",
    category_filter: "Danh mục",
    transaction_type: "Loại giao dịch",
    export_history: "Lịch sử xuất báo cáo",
    login_to_view_history: "Vui lòng đăng nhập để xem lịch sử",

    // Auth Pages
    system_login: "Đăng nhập hệ thống",
    social_login_desc: "Sử dụng tài khoản social để truy cập nhanh và quản lý ví ngay lập tức.",
    welcome_back: "Chào mừng trở lại",
    use_your_account: "Sử dụng tài khoản của bạn",
    email_address: "Địa chỉ Email",
    password_label: "Mật khẩu",
    forgot_password: "Quên mật khẩu?",
    or_continue_with: "Hoặc tiếp tục bằng",
    google: "Google",
    github: "GitHub",
    no_account_yet: "Chưa có tài khoản?",
    create_account: "Tạo tài khoản",
    processing_wait: "Đang xử lý, vui lòng chờ...",
    login_success: "Đăng nhập thành công! Đang chuyển hướng...",
    login_failed: "Đăng nhập thất bại!",
    github_auth_error: "Lỗi xác thực GitHub: ",
    loading_login_page: "Đang tải trang đăng nhập...",
    register_title: "Tham gia SpendWise ngay",
    register_subtitle: "Bắt đầu hành trình quản lý tài chính thông minh",
    register_subtitle_detail: "Tham gia SpendWise ngay hôm nay. Chỉ mất một phút!",
    register_hero_desc: "Mở khóa công cụ tài chính cao cấp, theo dõi liền mạch và quản lý tài sản hiệu quả.",
    start_your_journey: "Bắt đầu hành trình của bạn",
    new_card_placeholder: "MỚI **** 9988",
    register_success: "Đăng ký thành công! Đang chuyển hướng...",
    register_failed: "Đăng ký thất bại!",
    agree_to: "Tôi đồng ý với các ",
    terms_and_conditions: "Điều khoản & Điều kiện",
    register_btn: "Đăng ký",
    or_register_with: "Hoặc đăng ký bằng",
    already_have_account: "Đã có tài khoản?",
    sign_in_now: "Đăng nhập ngay",
    full_name_label: "Họ và tên",

    // Wallets Page
    wallet_management: "Quản lý Ví & Tài sản",
    wallets_and_accounts: "Ví & Tài khoản tiền",
    create_new_wallet: "+ Tạo ví mới",
    login_required_to_create_wallet: "Bạn cần phải đăng nhập mới được tạo ví",
    no_wallets_desc: "Bắt đầu quản lý tài chính bằng cách tạo chiếc ví đầu tiên của bạn!",
    create_wallet_now: "Tạo ví ngay",
    balance_label: "Số dư",
    type_label_prefix: "Loại: ",
    cash: "Tiền mặt",
    bank: "Ngân hàng",
    ewallet: "Ví điện tử",
    add_new_wallet: "Thêm ví mới",
    edit_wallet: "Chỉnh sửa ví",
    wallet_name: "Tên ví",
    my_new_wallet_placeholder: "VÍ MỚI CỦA TÔI",
    initial_balance: "Số dư khởi tạo",
    wallet_name_placeholder: "Nhập tên ví (ví dụ: Ví Tiền Mặt)",
    initial_balance_label: "Số dư ban đầu",
    balance_locked_warning: "Không được thay đổi số dư sau khi tạo",
    select_wallet_type: "Chọn loại ví",
    select_icon: "Chọn biểu tượng",
    select_color: "Chọn màu sắc",
    create_wallet_btn: "Tạo ví",
    delete_wallet_confirm: "Bạn có chắc chắn muốn xóa ví này?",
    create_wallet_error: "Lỗi khi tạo ví!",
    update_wallet_error: "Lỗi khi cập nhật ví!",
    delete_wallet_error: "Lỗi khi xóa ví!",

    // Budget Page
    budget_management: "Ngân sách & Kế hoạch",
    set_budget: "+ Đặt ngân sách",
    copy_from_previous_month: "📋 Sao chép từ tháng trước",
    total_monthly_budget: "Ngân sách tổng tháng",
    category_budgets: "Ngân sách danh mục",
    details: "Chi tiết",
    used_label: "Đã dùng",
    remaining_label: "Còn lại:",
    limit_label: "Hạn mức:",
    over_budget: "Vượt ngân sách!",
    almost_empty: "Gần hết!",
    food: "Ăn uống",
    transport: "Di chuyển",
    shopping: "Mua sắm",
    entertainment: "Giải trí",
    health: "Y tế",
    education: "Giáo dục",
    bills: "Hóa đơn",
    rent: "Tiền thuê",

    // Budget Extra
    budget_no_expenses: "Chưa phát sinh chi tiêu trong tháng này",
    budget_no_expenses_desc: "Biểu đồ phân tích sẽ tự động hiển thị ngay khi bạn có giao dịch chi tiêu được hoàn tất trong tháng.",
    total_spending_label: "TỔNG CHI",
    month_label: "Tháng",
    year_label: "Năm",
    month_1: "Tháng 1",
    month_2: "Tháng 2",
    month_3: "Tháng 3",
    month_4: "Tháng 4",
    month_5: "Tháng 5",
    month_6: "Tháng 6",
    month_7: "Tháng 7",
    month_8: "Tháng 8",
    month_9: "Tháng 9",
    month_10: "Tháng 10",
    month_11: "Tháng 11",
    month_12: "Tháng 12",
    other_category: "Danh mục khác",
    total_monthly_budget_title: "TỔNG NGÂN SÁCH THÁNG",
    total_category_budget_title: "TỔNG NGÂN SÁCH CÁC DANH MỤC",
    edit_limit: "✏️ Sửa hạn mức",
    delete_total_limit: "Xóa hạn mức tổng",
    over_limit_by: "⚠️ Vượt",
    equal_to_last_month: "~ Bằng tháng trước",
    remaining: "Còn lại",
    all_budget_used: "Đã dùng hết ngân sách",
    current_available_balance: "Số dư khả dụng hiện tại",
    avg_per_day: "Trung bình/ngày",
    based_on_passed_days: "Tính trên {days} ngày đã qua",
    month_end_forecast: "Dự báo cuối tháng",
    projected_over_budget: "⚠️ Dự kiến vượt hạn mức",
    projected_within_budget: "Dự kiến chi hết tháng",
    category_limits_count: "Số danh mục hạn mức",
    categories_unit: "danh mục",
    out_of_total_categories: "Từ tổng số {total} nhóm chi tiêu",
    spending_structure_by_category: "Cơ cấu chi tiêu theo ngân sách danh mục",
    click_to_view_tx: "Bấm để xem chi tiết giao dịch",
    edit_label: "✏️ Sửa",
    delete_label: "🗑️ Xóa",
    transactions_in_month: "Giao dịch trong tháng",
    loading_transactions: "Đang tải giao dịch...",
    no_transactions_found_budget: "Không có giao dịch nào.",
    no_budget_setup: "Chưa thiết lập ngân sách tháng này",
    no_budget_desc: "Thiết lập ngân sách giúp bạn kiểm soát việc chi tiêu tốt hơn, tối ưu hóa tiền tích lũy và nhanh chóng đạt được các cột mốc tự do tài chính.",
    set_new_budget: "➕ Đặt ngân sách mới",
    past_months_budget_history: "Lịch sử ngân sách các tháng trước",
    item_unit: "mục",
    over_budget_alert: "🚨 Đã vượt ngân sách",
    no_past_budgets: "Không tìm thấy ngân sách của các tháng trước.",
    edit_budget_limit: "Chỉnh sửa hạn mức ngân sách",
    setup_budget_limit: "Thiết lập ngân sách hạn mức",
    apply_to_category: "Áp dụng cho danh mục",
    overall_budget_option: "Ngân sách chung (Toàn bộ chi tiêu)",
    limit_amount_label: "Số tiền hạn mức (đ)",
    limit_amount_placeholder: "VD: 5000000",
    saving_label: "Đang lưu...",
    save_budget_btn: "Lưu ngân sách",
    invalid_limit_msg: "Vui lòng nhập số tiền hạn mức hợp lệ!",
    save_budget_success: "Lưu hạn mức ngân sách thành công!",
    save_budget_error: "Lỗi khi lưu hạn mức ngân sách",
    delete_budget_confirm_title: "Xóa ngân sách",
    delete_budget_confirm_msg: "Bạn có chắc chắn muốn xóa ngân sách này?",
    delete_budget_success: "Đã xóa ngân sách thành công!",
    delete_budget_error: "Lỗi khi xóa ngân sách",
    copy_budget_confirm_title: "Sao chép ngân sách",
    copy_budget_confirm_msg: "Bạn có muốn sao chép toàn bộ hạn mức ngân sách từ tháng {from} sang tháng {to} không?",
    copy_budget_success: "Sao chép thành công! Đã sao chép {count} mục hạn mức.",
    copy_budget_error: "Không tìm thấy ngân sách nguồn để sao chép!",

    // Notifications Page
    notification_center: "Trung tâm thông báo",
    create_notification: "+ Tạo thông báo",
    unread: "Chưa đọc",
    warning_label: "Cảnh báo",
    auto_transaction: "GD tự động",
    login_to_view_notifications: "Vui lòng đăng nhập để xem thông báo",
    send_system_notification: "Gửi thông báo hệ thống",
    title_label: "Tiêu đề",
    content_label: "Nội dung",
    notif_title_placeholder: "VD: Khuyến mãi mới!",
    notif_content_placeholder: "Nhập nội dung thông báo...",
    send_notification: "Gửi thông báo",

    // Transactions Page
    transaction_management: "Quản lý giao dịch",
    search_tx_placeholder: "Tìm giao dịch...",
    add_transaction: "+ Thêm giao dịch",
    description: "Mô tả",
    tx_id: "Mã giao dịch",
    date_label: "Ngày",
    amount_label: "Số tiền",
    actions: "Thao tác",
    previous: "← Trước",
    next: "Sau →",
    add_new_transaction: "Thêm giao dịch mới",
    transaction_name: "Tên giao dịch",
    tx_name_placeholder: "VD: Tiền ăn trưa, Mua sắm...",
    tx_amount_placeholder: "VD: 50000",
    other: "Khác",
    save_transaction: "Lưu giao dịch",
    notes: "Ghi chú",
    receipt_image: "Ảnh hóa đơn",
    type: "Loại",
    notes_placeholder: "Thêm ghi chú...",
    click_to_upload: "Nhấn để tải lên ảnh hóa đơn",
    select_category: "Chọn danh mục",
    please_fill_all_required_fields: "Vui lòng điền các trường bắt buộc",
    confirm_delete_tx: "Bạn có chắc chắn muốn xóa giao dịch này?",
    no_transactions_found: "Không tìm thấy giao dịch nào",

    // Category Extra
    limit_reached: "Tạo thêm (0/20) để quản lý tốt hơn",
    set_as_parent: "Thiết lập là Danh mục mẹ",
    cat_name_placeholder: "Ví dụ: Ăn uống, Di chuyển...",
    choose_icon_color: "Chọn biểu tượng & màu",
    loading_icons: "Đang tải biểu tượng...",
    choose_parent_cat: "Chọn danh mục cha",
    select_tone: "Chọn tông màu",
  },
  en: {
    // Sidebar & Navigation
    categories: "Categories",
    wallets: "My Wallets",
    transactions: "Transactions",
    dashboard: "Dashboard",
    investments: "Investments",
    loans: "Loans",
    budget: "Budget",
    reports: "Reports",
    settings: "Settings",
    notifications: "Notifications",
    login: "Login",
    logout: "Logout",
    new_user: "New User",

    // Common Actions
    add_new_category: "+ Add New Category",
    edit: "Edit",
    delete: "Delete",
    done: "Done",
    confirm: "Confirm",
    cancel: "Cancel",
    save_changes: "Save Changes",
    saving: "Saving...",
    cancel_changes: "Cancel",
    search: "Search",
    search_placeholder: "Search...",
    loading: "Loading...",
    download: "Download",
    reload: "Reload",
    all: "All",

    // Categories Page
    category_name: "Category Name",
    parent_category: "Parent Category",
    select: "Select",
    icon: "Icon",
    change_icon: "Change Icon",
    delete_confirm_msg: "Are you sure you want to delete this category?",
    create_success: "Category created successfully!",
    delete_success: "Category deleted!",
    spending: "Spending",
    income: "Income",
    transactions_count: "transactions",
    sub_categories: "Sub-categories",
    management: "Management",
    category_management: "Category Management",

    // Dashboard Page
    total_income: "Total Income",
    total_expense: "Total Expense",
    net_balance: "Net Balance",
    total_wallet_balance: "Total Wallet Balance",
    income_vs_expense: "Income vs Expense",
    daily_spending_trend: "Daily Spending Trend",
    top_categories: "Top 5 Spending Categories",
    vs_last_month: "vs last month",
    no_change_vs_last_month: "No change vs last month",
    this_week: "This Week",
    this_month: "This Month",
    this_quarter: "This Quarter",
    this_year: "This Year",
    custom_period: "Custom",
    expense_allocation: "Expense Allocation",
    recent_transactions: "Recent Transactions",
    no_transactions: "No transactions",
    no_data: "No data yet",
    no_transaction_data: "No transaction data yet",
    syncing_chart: "Syncing chart...",
    add_report: "+ Add Report",
    main_account: "Main Account",
    developing_budget: "Budget feature in development",
    no_wallets: "No wallets yet",

    // Settings Page
    settings_customize: "Settings & Customization",
    personal_info: "Personal Info",
    display_options: "Display Options",
    security: "Security",
    full_name: "Full Name",
    email: "Email",
    phone: "Phone Number",
    address: "Address",
    not_updated: "Not updated",
    email_not_verified: "Email not verified",
    enter_placeholder: "Enter",
    please_login: "Please login",
    currency_label: "Currency",
    language_label: "Language",
    dark_mode: "Dark Mode",
    dark_mode_desc: "Reduce eye strain and save battery on OLED screens",
    save_preferences: "Save Preferences",
    account_security: "Account Security",
    current_password: "Current Password",
    new_password: "New Password",
    confirm_new_password: "Confirm New Password",
    enter_new_password: "Enter new password...",
    confirm_password_again: "Re-enter new password...",
    update_password: "Update Password",
    updating: "Updating...",
    revoke_all_devices: "Revoke All Devices",
    delete_account: "Delete Account",
    delete_account_warning: "This action will permanently delete all your transactions and wallet data.",
    delete_account_now: "Delete Account Now",
    update_success: "Update successful!",
    avatar_update_success: "Avatar updated successfully!",
    fill_all_password: "Please fill in all password fields!",
    password_mismatch: "New password and confirmation do not match!",
    password_change_success: "Password changed! You will be logged out for security.",
    delete_confirm_1: "ARE YOU SURE YOU WANT TO DELETE YOUR ACCOUNT? This action cannot be undone and all transaction and wallet data will be permanently erased.",
    delete_confirm_2: "FINAL CONFIRMATION: Do you really want to permanently delete your SpendWise account?",
    account_deleted: "Your account and all related data have been permanently deleted.",
    error_prefix: "Error: ",
    delete_error: "Error deleting account: ",

    // Reports Page
    reports_export: "Reports & Data Export",
    export_pdf: "Export PDF",
    export_pdf_desc: "Summary report with charts",
    export_excel: "Export Excel",
    export_excel_desc: "All transactions as spreadsheet",
    export_csv: "Export CSV",
    export_csv_desc: "Raw data for importing to other apps",
    filter_before_export: "Filter Before Export",
    from_date: "From Date",
    to_date: "To Date",
    category_filter: "Category",
    transaction_type: "Transaction Type",
    export_history: "Export History",
    login_to_view_history: "Please login to view history",

    // Auth Pages
    system_login: "System Login",
    social_login_desc: "Use social accounts for quick access and instant wallet management.",
    welcome_back: "Welcome Back",
    use_your_account: "Use your account",
    email_address: "Email Address",
    password_label: "Password",
    forgot_password: "Forgot Password?",
    or_continue_with: "Or continue with",
    google: "Google",
    github: "GitHub",
    no_account_yet: "Don't have an account?",
    create_account: "Create Account",
    processing_wait: "Processing, please wait...",
    login_success: "Login successful! Redirecting...",
    login_failed: "Login failed!",
    github_auth_error: "GitHub authentication error: ",
    loading_login_page: "Loading login page...",
    register_title: "Join SpendWise Now",
    register_subtitle: "Start your smart financial management journey",
    register_subtitle_detail: "Join SpendWise today. It only takes a minute!",
    register_hero_desc: "Unlock premium financial tools, seamless tracking and effective asset management.",
    start_your_journey: "Start your journey",
    new_card_placeholder: "NEW **** 9988",
    register_success: "Registration successful! Redirecting...",
    register_failed: "Registration failed!",
    agree_to: "I agree to the ",
    terms_and_conditions: "Terms & Conditions",
    register_btn: "Register",
    or_register_with: "Or register with",
    already_have_account: "Already have an account?",
    sign_in_now: "Sign in now",
    full_name_label: "Full Name",

    // Wallets Page
    wallet_management: "Wallet & Asset Management",
    wallets_and_accounts: "Wallets & Accounts",
    create_new_wallet: "+ Create New Wallet",
    login_required_to_create_wallet: "Please login to create a wallet",
    no_wallets_desc: "Start managing your finances by creating your first wallet!",
    create_wallet_now: "Create Wallet Now",
    balance_label: "Balance",
    type_label_prefix: "Type: ",
    cash: "Cash",
    bank: "Bank",
    ewallet: "E-wallet",
    add_new_wallet: "Add New Wallet",
    edit_wallet: "Edit Wallet",
    wallet_name: "Wallet Name",
    my_new_wallet_placeholder: "MY NEW WALLET",
    initial_balance: "Initial Balance",
    wallet_name_placeholder: "Enter wallet name (e.g. Cash Wallet)",
    initial_balance_label: "Initial Balance",
    balance_locked_warning: "Balance cannot be changed after creation",
    select_wallet_type: "Select Wallet Type",
    select_icon: "Select Icon",
    select_color: "Select Color",
    create_wallet_btn: "Create Wallet",
    delete_wallet_confirm: "Are you sure you want to delete this wallet?",
    create_wallet_error: "Error creating wallet!",
    update_wallet_error: "Error updating wallet!",
    delete_wallet_error: "Error deleting wallet!",

    // Budget Page
    budget_management: "Budget & Planning",
    set_budget: "+ Set Budget",
    copy_from_previous_month: "📋 Copy from last month",
    total_monthly_budget: "Total monthly budget",
    category_budgets: "Category budgets",
    details: "Details",
    used_label: "Used",
    remaining_label: "Remaining:",
    limit_label: "Limit:",
    over_budget: "Over budget!",
    almost_empty: "Almost empty!",
    food: "Food",
    transport: "Transport",
    shopping: "Shopping",
    entertainment: "Entertainment",
    health: "Health",
    education: "Education",
    bills: "Bills",
    rent: "Rent",

    // Budget Extra
    budget_no_expenses: "No expenses recorded this month",
    budget_no_expenses_desc: "Spending charts will automatically appear as soon as you complete transactions this month.",
    total_spending_label: "TOTAL SPEND",
    month_label: "Month",
    year_label: "Year",
    month_1: "January",
    month_2: "February",
    month_3: "March",
    month_4: "April",
    month_5: "May",
    month_6: "June",
    month_7: "July",
    month_8: "August",
    month_9: "September",
    month_10: "October",
    month_11: "November",
    month_12: "December",
    other_category: "Other category",
    total_monthly_budget_title: "TOTAL MONTHLY BUDGET",
    total_category_budget_title: "TOTAL CATEGORY BUDGETS",
    edit_limit: "✏️ Edit Limit",
    delete_total_limit: "Delete Total Limit",
    over_limit_by: "⚠️ Over by",
    equal_to_last_month: "~ Same as last month",
    remaining: "Remaining",
    all_budget_used: "All budget spent",
    current_available_balance: "Current available balance",
    avg_per_day: "Daily Average",
    based_on_passed_days: "Based on {days} passed days",
    month_end_forecast: "Month-end Forecast",
    projected_over_budget: "⚠️ Projected to exceed limit",
    projected_within_budget: "Projected to stay within budget",
    category_limits_count: "Category Limits Set",
    categories_unit: "categories",
    out_of_total_categories: "Out of {total} spending groups",
    spending_structure_by_category: "Spending Structure by Category Budgets",
    click_to_view_tx: "Click to view transaction details",
    edit_label: "✏️ Edit",
    delete_label: "🗑️ Delete",
    transactions_in_month: "Transactions this month",
    loading_transactions: "Loading transactions...",
    no_transactions_found_budget: "No transactions found.",
    no_budget_setup: "No budget setup for this month",
    no_budget_desc: "Setting up a budget helps you control spending better, optimize savings, and reach financial freedom milestones faster.",
    set_new_budget: "➕ Set New Budget",
    past_months_budget_history: "Past Months' Budget History",
    item_unit: "items",
    over_budget_alert: "🚨 Over Budget",
    no_past_budgets: "No past budget history found.",
    edit_budget_limit: "Edit Budget Limit",
    setup_budget_limit: "Setup Budget Limit",
    apply_to_category: "Apply to Category",
    overall_budget_option: "Overall Budget (All spending)",
    limit_amount_label: "Limit Amount",
    limit_amount_placeholder: "e.g. 5000000",
    saving_label: "Saving...",
    save_budget_btn: "Save Budget",
    invalid_limit_msg: "Please enter a valid limit amount!",
    save_budget_success: "Budget limit saved successfully!",
    save_budget_error: "Error saving budget limit",
    delete_budget_confirm_title: "Delete Budget",
    delete_budget_confirm_msg: "Are you sure you want to delete this budget?",
    delete_budget_success: "Budget deleted successfully!",
    delete_budget_error: "Error deleting budget",
    copy_budget_confirm_title: "Copy Budget",
    copy_budget_confirm_msg: "Do you want to copy all budget limits from month {from} to month {to}?",
    copy_budget_success: "Copied successfully! Copied {count} budget limits.",
    copy_budget_error: "Source budget not found to copy!",

    // Notifications Page
    notification_center: "Notification Center",
    create_notification: "+ Create Notification",
    unread: "Unread",
    warning_label: "Warning",
    auto_transaction: "Auto Txn",
    login_to_view_notifications: "Please login to view notifications",
    send_system_notification: "Send System Notification",
    title_label: "Title",
    content_label: "Content",
    notif_title_placeholder: "e.g. New Promo!",
    notif_content_placeholder: "Enter notification content...",
    send_notification: "Send Notification",

    // Transactions Page
    transaction_management: "Transaction Management",

    search_tx_placeholder: "Search transactions...",
    add_transaction: "+ Add Transaction",
    description: "Description",
    tx_id: "Transaction ID",
    date_label: "Date",
    amount_label: "Amount",
    actions: "Actions",
    previous: "← Prev",
    next: "Next →",
    add_new_transaction: "Add New Transaction",
    transaction_name: "Transaction Name",
    tx_name_placeholder: "e.g. Lunch, Shopping...",
    tx_amount_placeholder: "e.g. 50000",
    other: "Other",
    save_transaction: "Save Transaction",
    notes: "Notes",
    receipt_image: "Receipt Image",
    type: "Type",
    notes_placeholder: "Add notes...",
    click_to_upload: "Click to upload receipt image",
    select_category: "Select category",
    please_fill_all_required_fields: "Please fill all required fields",
    confirm_delete_tx: "Are you sure you want to delete this transaction?",
    no_transactions_found: "No transactions found",

    // Category Extra
    limit_reached: "Create more (0/20) for better management",
    set_as_parent: "Set as Parent Category",
    cat_name_placeholder: "e.g. Food, Transport...",
    choose_icon_color: "Choose Icon & Color",
    loading_icons: "Loading icons...",
    choose_parent_cat: "Choose Parent Category",
    select_tone: "Select tone",

  }
};

export const getCategoryTranslationKey = (name: string): string => {
  if (!name) return '';
  const normalized = name.toLowerCase().trim();
  switch (normalized) {
    case 'ăn uống':
    case 'food':
      return 'food';
    case 'di chuyển':
    case 'transport':
    case 'transportation':
      return 'transport';
    case 'mua sắm':
    case 'shopping':
      return 'shopping';
    case 'giải trí':
    case 'entertainment':
      return 'entertainment';
    case 'y tế':
    case 'health':
    case 'medical':
      return 'health';
    case 'giáo dục':
    case 'education':
      return 'education';
    case 'hóa đơn':
    case 'bills':
    case 'bill':
      return 'bills';
    case 'tiền thuê':
    case 'rent':
      return 'rent';
    case 'khác':
    case 'other':
      return 'other';
    default:
      return '';
  }
};

type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tCategory: (name: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('vi');
  const { userData, isLoggedIn, updateUserPreference } = useAppContext();

  // 1. Initial language load from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang && (savedLang === 'vi' || savedLang === 'en')) {
      setLanguage(savedLang);
    }
  }, []);

  // 2. Synchronize language with backend user preference when logged in
  useEffect(() => {
    if (isLoggedIn && userData?.preference?.language) {
      const userLang = userData.preference.language as Language;
      if (userLang && (userLang === 'vi' || userLang === 'en') && userLang !== language) {
        setLanguage(userLang);
        localStorage.setItem('app_lang', userLang);
      }
    }
  }, [userData, isLoggedIn]);

  const handleSetLanguage = async (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_lang', lang);

    // Sync language update to backend if logged in
    if (isLoggedIn && userData) {
      try {
        await authApi.updateProfile({ language: lang });
        updateUserPreference({ language: lang });
      } catch (err) {
        console.error("Lỗi đồng bộ ngôn ngữ lên server:", err);
      }
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['vi']?.[key] || key;
  };

  const tCategory = (name: string): string => {
    const key = getCategoryTranslationKey(name);
    return key ? t(key) : name;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, tCategory }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
