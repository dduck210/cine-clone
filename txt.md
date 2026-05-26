Bạn là Senior Fullstack Developer có 10+ năm kinh nghiệm với NodeJS, ExpressJS, MongoDB/MySQL, REST API, ReactJS và hệ thống Admin Dashboard production.

Tôi đang gặp lỗi bulk actions trong trang admin.

Hiện tại FE đang gọi các API:

* POST /api/movies/bulk-delete
* POST /api/showtimes/bulk-cancel
* POST /api/admin/users/bulk-delete
* POST /api/reviews/admin/bulk-delete
* POST /api/vouchers/admin/bulk-delete

Nhưng backend trả về:

Cannot POST /api/...

=> Tôi nghi vấn lỗi nằm ở backend routes hoặc API flow chứ không phải frontend.

Nhiệm vụ của bạn:
Hãy debug và sửa toàn bộ flow bulk actions giữa FE và BE để:

* xóa nhiều phim
* hủy nhiều suất chiếu
* xóa nhiều users
* xóa nhiều reviews
* xóa nhiều vouchers

hoạt động ổn định.

Yêu cầu phân tích:

1. Kiểm tra backend routes:

   * express router
   * route prefixes
   * mounted routes
   * method mismatch
   * middleware auth/admin
   * controller binding
   * export/import routes

2. Kiểm tra:

   * FE đang gọi đúng endpoint chưa
   * backend có route tương ứng chưa
   * route method có đúng POST/DELETE/PATCH không
   * có conflict route không
   * có thiếu app.use() mount route không
   * có sai version prefix (/api/admin/...) không

3. Trace toàn bộ flow:
   FE button
   -> API service
   -> axios/fetch
   -> backend route
   -> controller
   -> service
   -> database query

4. Nếu backend chưa có route:

   * tạo đầy đủ route chuẩn RESTful
   * tạo controller
   * validate request body
   * xử lý bulk ids
   * trả response chuẩn

Ví dụ request:

```json
{
  "ids": ["id1", "id2", "id3"]
}
```

Yêu cầu response:

```json
{
  "success": true,
  "message": "Deleted successfully",
  "affectedCount": 3
}
```

5. Kiểm tra database query:

* deleteMany
* updateMany
* transaction nếu cần
* soft delete nếu project đang dùng soft delete

6. Kiểm tra FE:

* selected rows
* payload gửi lên
* API URL constants
* env baseURL
* axios method
* error handling
* optimistic update
* loading state

7. Yêu cầu cực kỳ quan trọng:

* Không rewrite toàn bộ project
* Không phá flow cũ
* Không đổi business logic hiện tại
* Chỉ sửa đúng phần bulk action
* Giữ nguyên UI hiện tại

8. Sau khi sửa:

* Thêm proper error handling
* Toast success/error
* Empty selection validation
* Disable button khi loading
* Refetch data sau bulk action

9. Hãy output theo thứ tự:

* Phân tích nguyên nhân thật sự
* File nào cần sửa
* Route nào bị thiếu/sai
* FE hay BE là nguyên nhân chính
* Sau đó mới bắt đầu sửa code

10. Nếu phát hiện lỗi:
    “Cannot POST /api/...”
    hãy ưu tiên kiểm tra:

* backend route chưa tồn tại
* sai method
* sai prefix
* chưa mount router vào app
* FE gọi sai URL
  trước khi sửa logic khác.
