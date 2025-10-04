# Tích hợp AI vào HSE Document Register

## Tổng quan

Dự án đã được nâng cấp với tính năng đề xuất hành động thông minh sử dụng AI. Hệ thống hỗ trợ nhiều AI service miễn phí để giúp người dùng đưa ra quyết định tốt hơn khi quản lý tài liệu HSE.

## Các AI Service được hỗ trợ

### 1. GLM-4.5-Flash (z.ai)
- **Miễn phí** với giới hạn khá rộng
- Tốc độ phản hồi nhanh
- Khả năng hiểu tiếng Việt tốt
- API Endpoint: `https://open.bigmodel.cn/api/paas/v4/chat/completions`

### 2. Google Gemini API
- **Miễn phí** với limit đáng kể
- Tích hợp dễ dàng
- Hỗ trợ đa ngôn ngữ
- API Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

## Cài đặt

### 1. Lấy API Key

#### Đối với GLM-4.5-Flash:
1. Truy cập https://platform.z.ai/
2. Đăng ký tài khoản miễn phí
3. Lấy API key từ dashboard

#### Đối với Google Gemini:
1. Truy cập https://makersuite.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google
3. Tạo mới API key

#### Đối với OpenAI:
1. Truy cập https://platform.openai.com/api-keys
2. Đăng nhập bằng tài khoản OpenAI
3. Tạo mới API key

### 2. Cấu hình AI trong Admin Settings

1. Đăng nhập vào hệ thống với quyền admin
2. Truy cập trang Admin Settings
3. Chọn tab "Cấu hình AI"
4. Nhấn vào nút "Thêm GLM-4.5-Flash" hoặc "Thêm Gemini Pro" hoặc "Thêm OpenAI GPT"
5. Điền thông tin cấu hình:
   - API Key: Nhập API key đã lấy từ bước 1
   - API Endpoint: Đã được điền tự động, có thể thay đổi nếu cần
   - Temperature: Độ ngẫu nhiên của response (0-1)
   - Max Tokens: Số token tối đa cho response
6. Bật switch "Kích hoạt" để sử dụng cấu hình
7. Nếu có nhiều cấu hình, chọn "Sử dụng làm mặc định" cho cấu hình chính
8. Nhấn nút "Test" để kiểm tra kết nối
9. Nhấn nút "Lưu" để lưu cấu hình

### 3. Khởi động lại ứng dụng

```bash
npm run dev
```

## Sử dụng

### 1. Cấu hình AI

Trước khi sử dụng, đảm bảo đã cấu hình AI trong Admin Settings như hướng dẫn ở trên.

### 2. Bật AI Mode

Trong dashboard, tìm component "Recommended Actions" và bật switch "AI Mode":

![AI Mode Switch](images/ai-mode-switch.png)

### 3. Xem đề xuất AI

Khi AI Mode được bật:
- Hệ thống sẽ tự động phân tích các critical issues
- Tạo ra đề xuất hành động thông minh
- Hiển thị badge "AI" để phân biệt với đề xuất thông thường

### 3. Các loại hành động được đề xuất

AI sẽ đề xuất các loại hành động sau:
- **Meeting**: Tổ chức họp với nhà thầu
- **Email**: Gửi email nhắc nhở hoặc cảnh báo
- **Escalation**: Báo cáo cấp cao khi vấn đề nghiêm trọng
- **Support**: Cung cấp hỗ trợ kỹ thuật
- **Training**: Đề xuất đào tạo thêm

### 4. Mức độ tin cậy

Mỗi đề xuất AI đi kèm với mức độ tin cậy (0-100%):
- **90-100%**: Rất chắc chắn, nên thực hiện
- **70-89%**: Khá chắc chắn, cân nhắc thực hiện
- **50-69%**: Có thể hữu ích, tùy tình huống
- **<50%**: Tham khảo, cần đánh giá thêm

## Cách hoạt động

### 1. Thu thập dữ liệu

Hệ thống thu thập:
- Danh sách các critical issues (red cards và amber alerts)
- Thông tin nhà thầu
- Bối cảnh dự án (giai đoạn, mức độ áp lực, mức độ hiển thị)

### 2. Tạo prompt

AI service nhận prompt được cấu trúc với:
- Thông tin chi tiết về các vấn đề
- Bối cảnh dự án
- Yêu cầu rõ ràng về định dạng response

### 3. Phân tích response

Hệ thống:
- Parse JSON response từ AI
- Tạo các đề xuất có cấu trúc
- Hiển thị cho người dùng
- Lưu lại để phân tích sau này

## Xử lý lỗi

### 1. AI Service không khả dụng

Khi AI service gặp lỗi:
- Hệ thống tự động chuyển sang rule-based suggestions
- Hiển thị thông báo lỗi cho người dùng
- Không ảnh hưởng đến các chức năng khác

### 2. AI chưa được cấu hình

Khi AI chưa được cấu hình:
- Hệ thống sẽ hiển thị thông báo "Please configure AI in Admin Settings first"
- Cần cấu hình AI trong Admin Settings trước khi sử dụng

### 3. API Key hết hạn

Khi API key hết hạn hoặc không hợp lệ:
- Hệ thống sẽ báo lỗi khi test kết nối
- Cần cập nhật API key trong Admin Settings

## Tùy chỉnh

### 1. Thêm nhà cung cấp AI mới

Trong file `src/services/aiRecommendationService.ts`:
- Thêm method mới cho provider (ví dụ: `callClaudeAPI`)
- Cập nhật method `getRecommendations` để xử lý provider mới
- Thêm endpoint mặc định trong Admin Settings

### 2. Thay đổi prompt template

Trong file `src/services/aiRecommendationService.ts`, method `generatePrompt`:
- Tùy chỉnh prompt để phù hợp với nhu cầu dự án
- Thêm context mới nếu cần

### 3. Thêm loại hành động mới

Trong file `src/components/dashboard/ActionSuggestions.tsx`:
- Thêm icon mới vào `actionTypeIcons`
- Cập nhật interface `AIRecommendation`

## Bảo mật

- API key được lưu trong localStorage của trình duyệt
- Không gửi thông tin nhạy cảm đến AI service
- Các request được log để theo dõi
- Admin có thể xóa hoặc thay đổi API key bất cứ lúc nào

## Hiệu suất

- AI service được gọi cache để tránh gọi lặp lại
- Có timeout để tránh treo ứng dụng
- Fallback mechanism đảm bảo hệ thống luôn hoạt động

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console log
2. Xác minh API key hợp lệ
3. Kiểm tra kết nối internet
4. Tạo issue trên GitHub repository

## Tương lai

Các tính năng sẽ được thêm trong tương lai:
- Lưu trữ cấu hình AI trong database thay vì localStorage
- Huấn luyện model với dữ liệu lịch sử của dự án
- Cá nhân hóa đề xuất theo từng nhà thầu
- Học hỏi từ phản hồi của người dùng
- Tích hợp thêm các AI service khác
- Cấu hình AI theo từng người dùng