# file-allocation-simulator-NEU
Interactive File Allocation Simulator for Contiguous, Linked and Indexed Allocation
# File Allocation Simulator

Ứng dụng web tương tác mô phỏng và so sánh ba phương pháp cấp phát file trong hệ điều hành: Contiguous, Linked và Indexed Allocation.

## Tổng quan

Simulator sử dụng một ổ đĩa ảo gồm 100 block, mỗi block có kích thước 4096 bytes. Người dùng có thể chọn file mẫu, chọn phương pháp cấp phát, quan sát yêu cầu lưu trữ và theo dõi trạng thái các block trên đĩa.

## Tính năng

- Mô phỏng ba phương pháp cấp phát file.
- Hiển thị trực quan các block trống và đã sử dụng.
- Tính toán số block cần thiết theo từng phương pháp.
- Xem bitmap vùng trống, thống kê ổ đĩa và metadata của block/file.
- Tải tình huống ổ đĩa phân mảnh để thử nghiệm.
- Xóa file đã cấp phát hoặc đặt lại simulator.

## Các phương pháp cấp phát

### Contiguous Allocation
Lưu file trong một dãy block liên tiếp. Phương pháp này đơn giản và hỗ trợ truy cập nhanh, nhưng cần vùng trống liên tục đủ lớn nên có thể thất bại khi ổ đĩa bị phân mảnh.

### Linked Allocation
Lưu file trên các block có thể nằm rải rác; mỗi block liên kết tới block kế tiếp. Không cần vùng liên tục, nhưng cần không gian cho con trỏ và việc truy cập phụ thuộc vào chuỗi liên kết.

### Indexed Allocation
Lưu dữ liệu trên các block có thể nằm rải rác và dùng một block chỉ mục để lưu địa chỉ các block dữ liệu. Phương pháp này cần thêm block chỉ mục.

## Cấu trúc dự án

```text
file-allocation-simulator-NEU/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── UI.js
│   ├── data.js
│   ├── state.js
│   ├── core/
│   │   ├── disk.js
│   │   └── file.js
│   └── allocations/
│       ├── contiguous.js
│       ├── linked.js
│       └── indexed.js
└── README.md
