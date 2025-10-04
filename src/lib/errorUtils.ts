/**
 * Maps database and Supabase errors to user-friendly messages
 * Prevents exposing internal system details to users
 */
export const mapErrorToUserMessage = (error: any): string => {
  // Log detailed error for debugging (server-side in production)
  if (process.env.NODE_ENV === 'development') {
    console.error('Operation failed:', error);
  }

  const errorMessage = error?.message || String(error);

  // Map common error patterns to safe user messages
  const errorMappings: Record<string, string> = {
    'PGRST116': 'Không thể hoàn thành thao tác',
    'duplicate key': 'Bản ghi này đã tồn tại',
    'foreign key': 'Không thể hoàn thành do dữ liệu liên quan',
    'not found': 'Không tìm thấy tài nguyên yêu cầu',
    'violates row-level security': 'Bạn không có quyền thực hiện thao tác này',
    'permission denied': 'Bạn không có quyền truy cập',
    'unique constraint': 'Dữ liệu đã tồn tại trong hệ thống',
    'invalid input': 'Dữ liệu nhập không hợp lệ',
    'connection': 'Lỗi kết nối mạng, vui lòng thử lại',
  };

  // Check for matching error patterns
  for (const [pattern, message] of Object.entries(errorMappings)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  // Default generic message - never expose raw error
  return 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
};
