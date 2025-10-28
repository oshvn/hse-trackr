# Hệ thống Red Cards 3 Mức Cảnh báo Thông minh

## Tổng quan

Hệ thống Red Cards được cải tiến với 3 mức cảnh báo thông minh giúp admin phát hiện sớm rủi ro và có hành động kịp thời:

### Mức 1 - Cảnh báo sớm (Amber)
- **Điều kiện**: Progress < 20% và còn > 7 ngày
- **Màu sắc**: Vàng (amber)
- **Actions**: Gửi email nhắc nhở, Lên lịch họp review, Cung cấp hỗ trợ kỹ thuật
- **Mục đích**: Phát hiện sớm các vấn đề tiềm ẩn

### Mức 2 - Cảnh báo khẩn (Orange)
- **Điều kiện**: Progress < 50% và còn > 3 ngày
- **Màu sắc**: Cam (orange)
- **Actions**: Họp hàng ngày, Escalation cho quản lý, Gán mentor hỗ trợ
- **Mục đích**: Can thiệp kịp thời trước khi quá hạn

### Mức 3 - Quá hạn (Red)
- **Điều kiện**: Progress < 80% và đã quá hạn
- **Màu sắc**: Đỏ (red)
- **Actions**: NGƯNG thi công, Họp với ban lãnh đạo, Xem xét thay thế nhà thầu
- **Mục đích**: Xử lý khủng hoảng và ngăn chặn thiệt hại

## Cấu trúc Technical

### Interfaces

```typescript
interface RedCardItem extends CriticalAlertItem {
  warningLevel: 1 | 2 | 3;
  progressPercentage: number;
  recommendedActions: string[];
  colorCode: 'amber' | 'orange' | 'red';
  daysUntilDue: number | null;
  daysOverdue: number;
  riskScore: number;
  aiRecommendations?: string[];
  actionButtons: {
    label: string;
    action: string;
    severity: 'primary' | 'secondary' | 'destructive';
  }[];
}
```

### Core Functions

1. **calculateWarningLevel()**: Xác định mức cảnh báo dựa trên progress và thời gian
2. **calculateRiskScore()**: Tính điểm rủi ro (0-100) dựa trên nhiều yếu tố
3. **extractRedCardsByLevel()**: Phân loại red cards theo 3 mức
4. **convertToRedCardItem()**: Chuyển đổi từ CriticalAlertItem sang RedCardItem

### Components

1. **CriticalAlertsCard**: Hiển thị red cards trên dashboard
2. **CriticalAlertsModal**: Modal chi tiết với tabs và actions
3. **RedCardsAnimations**: CSS animations và color coding

## AI Integration

Hệ thống tích hợp AI service để đề xuất actions thông minh:

```typescript
interface AIRecommendationRequest {
  contractorId: string;
  contractorName: string;
  criticalIssues: CriticalAlertItem[];
  redCards?: RedCardItem[];
  context: ProjectContext;
}
```

### AI Recommendations

- **Level 3**: Khuyến khích họp khẩn cấp, xem xét dừng thi công
- **Level 2**: Đề xuất họp hàng ngày, gán mentor hỗ trợ
- **Level 1**: Gợi ý email nhắc nhở, lên lịch review

## Animations & Color Coding

### CSS Classes

- `.red-card-level-1`: Animation pulse amber cho mức 1
- `.red-card-level-2`: Animation pulse orange cho mức 2
- `.red-card-level-3`: Animation pulse red cho mức 3

### Progress Bars

- `.progress-bar-level-1`: Gradient amber với shimmer effect
- `.progress-bar-level-2`: Gradient orange với shimmer effect
- `.progress-bar-level-3`: Gradient red với shimmer effect

### Risk Scores

- `.risk-score-high`: > 70% - Red gradient với pulse animation
- `.risk-score-medium`: 40-70% - Orange gradient với pulse animation
- `.risk-score-low`: < 40% - Amber gradient với pulse animation

## Usage

### Dashboard Integration

```typescript
// Extract red cards by level
const redCardsByLevel = useMemo(() => 
  extractRedCardsByLevel(filteredProgressData, criticalDocTypeIds), 
  [filteredProgressData, criticalDocTypeIds]
);

// Use in component
<CriticalAlertsCard
  redCards={redCardsByLevel}
  onSelect={(contractorId, docTypeId) => setSelectedDetail({ contractorId, docTypeId })}
  onViewAll={() => setIsCriticalAlertsModalOpen(true)}
/>
```

### AI Recommendations

```typescript
const recommendations = await aiRecommendationService.getRecommendations({
  contractorId: 'contractor-123',
  contractorName: 'ABC Construction',
  criticalIssues: criticalAlerts,
  redCards: redCardsByLevel.all,
  context: {
    projectPhase: 'execution',
    deadlinePressure: 'high',
    stakeholderVisibility: 'client'
  }
});
```

## Responsive Design

- Mobile: Optimized layout với simplified actions
- Tablet: Balanced layout với moderate animations
- Desktop: Full features với enhanced animations

## Accessibility

- Semantic HTML structure
- ARIA labels cho screen readers
- Keyboard navigation support
- High contrast mode support

## Performance

- Memoized calculations để tránh re-renders không cần thiết
- Lazy loading cho large datasets
- Optimized animations với CSS transforms
- Efficient filtering và sorting algorithms

## Future Enhancements

1. **Real-time Updates**: WebSocket integration cho live updates
2. **Predictive Analytics**: Machine learning để dự đoán rủi ro
3. **Mobile App**: Native mobile app với push notifications
4. **Integration APIs**: External system integration (SAP, Oracle)
5. **Advanced Reporting**: Custom reports với data visualization

## Troubleshooting

### Common Issues

1. **Red cards không hiển thị**: Kiểm tra data và filters
2. **Animations không hoạt động**: Kiểm tra CSS imports
3. **AI recommendations lỗi**: Kiểm tra API key và network

### Debug Tools

- Browser DevTools để inspect animations
- Network tab để kiểm tra API calls
- Console logs để debug AI recommendations

## Best Practices

1. **Data Quality**: Đảm bảo data chính xác và up-to-date
2. **User Training**: Training cho admin về new features
3. **Regular Updates**: Cập nhật AI models và algorithms
4. **Feedback Loop**: Thu thập user feedback để cải thiện
5. **Monitoring**: Monitor performance và usage metrics