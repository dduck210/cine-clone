require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

const ITEMS = [
  {
    regex: /shawshank/i,
    label: 'The Shawshank Redemption',
    description: `Năm 1947, Andy Dufresne — một chủ ngân hàng trẻ tuổi, điềm tĩnh và học thức — bị kết án hai lần chung thân vì tội giết vợ và người tình của cô, dù ông luôn khẳng định mình vô tội. Ông bị đưa đến nhà tù Shawshank — nơi bạo lực, tham nhũng và sự tàn nhẫn ngự trị như một quy luật bất thành văn.

Nhưng Andy không như những tù nhân khác. Ông kết bạn với Red — người "môi giới" lâu năm trong tù có thể kiếm bất cứ thứ gì — và dần dần tạo nên những thay đổi âm thầm mà sâu sắc: xây dựng thư viện nhà tù, dạy học cho bạn tù, và giúp những người đã đánh mất niềm tin vào cuộc đời tìm lại chút hy vọng le lói.

Suốt gần hai thập kỷ, Andy giữ trong mình một bí mật — một kế hoạch kiên nhẫn đến mức không ai có thể tưởng tượng nổi. Bởi vì như ông từng nói: "Hy vọng là điều tốt đẹp nhất trên đời, và những điều tốt đẹp không bao giờ chết."

Được mệnh danh là bộ phim hay nhất mọi thời đại, The Shawshank Redemption là câu chuyện bất hủ về ý chí con người, tình bạn và sức mạnh không thể bị giam cầm của tinh thần tự do.`,
  },
  {
    regex: /ring/i,
    label: 'The Ring',
    description: `Một cuốn băng video bí ẩn đang lưu hành trong giới trẻ với lời đồn ghê rợn: bất kỳ ai xem xong đều nhận được một cuộc điện thoại, và chết sau đúng 7 ngày.

Rachel Keller — phóng viên điều tra — ban đầu coi đó chỉ là tin đồn nhảm, cho đến khi cháu gái cô qua đời trong hoàn cảnh kỳ lạ, trên khuôn mặt là biểu hiện của nỗi kinh hoàng tột độ. Quyết tâm tìm ra sự thật, Rachel xem cuốn băng — và điện thoại reo.

Cuộc đua với tử thần bắt đầu. Mỗi manh mối dẫn đến một bí ẩn sâu hơn, mỗi câu trả lời mở ra thêm câu hỏi đáng sợ hơn. Phía sau cuốn băng là câu chuyện về một đứa trẻ, về sự oan khuất, và về một loại hận thù không thể xóa nhòa dù người chết đã nằm xuống.

The Ring là tượng đài của dòng phim kinh dị tâm lý — không cần máu me hay giật mình rẻ tiền, chỉ cần bầu không khí ám ảnh ngấm dần vào từng tế bào, khiến bạn không dám nhìn vào màn hình tivi sau khi tắt đèn.`,
  },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('MongoDB Connected\n');
  for (const item of ITEMS) {
    const result = await Movie.updateOne(
      { title: item.regex },
      { $set: { description: item.description } }
    );
    if (result.matchedCount > 0) console.log(`[OK] ${item.label}`);
    else console.log(`[SKIP] Không tìm thấy: ${item.label}`);
  }
  console.log('\nDone.');
  process.exit(0);
}).catch(e => { console.error('DB error:', e.message); process.exit(1); });
