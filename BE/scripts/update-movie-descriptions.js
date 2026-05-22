require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

const DESCRIPTIONS = [
  {
    title: 'The Avengers',
    description: `Khi Loki — người anh em nuôi đầy tham vọng của Thor — đến Trái Đất mang theo đội quân Chitauri hùng hậu, âm mưu chinh phục toàn nhân loại chưa bao giờ trở nên nguy hiểm đến vậy. Đứng trước hiểm họa diệt vong, đặc vụ Nick Fury của S.H.I.E.L.D. buộc phải triệu tập những cá nhân phi thường nhất thế giới.

Iron Man với bộ giáp thần thánh, Captain America với tinh thần thép, Thor với sức mạnh thần sấm, Hulk với sức tàn phá khổng lồ, Black Widow với kỹ năng điệp viên bậc thầy, và Hawkeye với tầm nhìn cung thủ không ai bì kịp — họ đến từ những thế giới khác nhau, mang những cái tôi không ai chịu nhường ai.

Nhưng khi cổng không gian Tesseract mở ra và hàng triệu sinh mạng bị đe dọa, những Avengers buộc phải chôn vùi mâu thuẫn cá nhân để đứng thành một khối thống nhất. Trận chiến tại thành phố New York sẽ không chỉ quyết định số phận nước Mỹ — mà là tương lai của cả Trái Đất.

Bom tấn mở đầu kỷ nguyên superhero đích thực, The Avengers là bài ca về sức mạnh của sự đoàn kết vượt lên trên mọi dị biệt.`,
  },
  {
    title: 'Superbad',
    description: `Seth và Evan — hai người bạn thân từ thuở ấu thơ — đang đứng trước ngưỡng cửa tốt nghiệp trung học với một nỗi sợ hãi to lớn: họ sẽ vào hai trường đại học khác nhau, và tình bạn thiêng liêng suốt bao năm liệu có còn nguyên vẹn?

Nhưng trước khi hè kết thúc, cả hai quyết tâm thực hiện một đêm huyền thoại — đêm tiệc tùng cuối cùng của tuổi học trò. Với sự trợ giúp của Fogell — cậu bạn vừa sắm được chứng minh thư giả với cái tên không thể quên hơn: McLovin — cuộc phiêu lưu tưởng chừng đơn giản bỗng biến thành một chuỗi thảm họa hài hước nối tiếp nhau không ngừng.

Từ bữa tiệc đình đám, hai cảnh sát tuần tra "hết sức chuyên nghiệp", đến những tình huống xấu hổ muốn độn thổ — mỗi khoảnh khắc đều là bài học về tình bạn, sự trưởng thành và chấp nhận bản thân.

Superbad là bộ phim teen-comedy thẳng thắn, ồn ào và chân thật đến mức ai đã từng là tuổi 17 đều sẽ thấy mình trong đó.`,
  },
  {
    title: 'The Shawshank Redemption',
    description: `Năm 1947, Andy Dufresne — một chủ ngân hàng trẻ tuổi, điềm tĩnh và học thức — bị kết án hai lần chung thân vì tội giết vợ và người tình của cô, dù ông luôn khẳng định mình vô tội. Ông bị đưa đến nhà tù Shawshank — nơi bạo lực, tham nhũng và sự tàn nhẫn ngự trị như một quy luật bất thành văn.

Nhưng Andy không như những tù nhân khác. Ông kết bạn với Red — người "môi giới" lâu năm trong tù có thể kiếm bất cứ thứ gì — và dần dần tạo nên những thay đổi âm thầm mà sâu sắc: xây dựng thư viện nhà tù, dạy học cho bạn tù, và giúp những người đã đánh mất niềm tin vào cuộc đời tìm lại chút hy vọng le lói.

Suốt gần hai thập kỷ, Andy giữ trong mình một bí mật — một kế hoạch kiên nhẫn đến mức không ai có thể tưởng tượng nổi. Bởi vì như ông từng nói: "Hy vọng là điều tốt đẹp nhất trên đời, và những điều tốt đẹp không bao giờ chết."

Được mệnh danh là bộ phim hay nhất mọi thời đại, The Shawshank Redemption là câu chuyện bất hủ về ý chí con người, tình bạn và sức mạnh không thể bị giam cầm của tinh thần tự do.`,
  },
  {
    title: 'The Ring',
    description: `Một cuốn băng video bí ẩn đang lưu hành trong giới trẻ với lời đồn ghê rợn: bất kỳ ai xem xong đều nhận được một cuộc điện thoại, và chết sau đúng 7 ngày.

Rachel Keller — phóng viên điều tra — ban đầu coi đó chỉ là tin đồn nhảm, cho đến khi cháu gái cô qua đời trong hoàn cảnh kỳ lạ, trên khuôn mặt là biểu hiện của nỗi kinh hoàng tột độ. Quyết tâm tìm ra sự thật, Rachel xem cuốn băng — và điện thoại reo.

Cuộc đua với tử thần bắt đầu. Mỗi manh mối dẫn đến một bí ẩn sâu hơn, mỗi câu trả lời mở ra thêm câu hỏi đáng sợ hơn. Phía sau cuốn băng là câu chuyện về một đứa trẻ, về sự oan khuất, và về một loại hận thù không thể xóa nhòa dù người chết đã nằm xuống.

The Ring là tượng đài của dòng phim kinh dị tâm lý — không cần máu me hay giật mình rẻ tiền, chỉ cần bầu không khí ám ảnh ngấm dần vào từng tế bào, khiến bạn không dám nhìn vào màn hình tivi sau khi tắt đèn.`,
  },
  {
    title: 'The Notebook',
    description: `Trong một viện dưỡng lão yên tĩnh, một người đàn ông tóc bạc ngày ngày ngồi đọc sách cho một người phụ nữ mắc chứng mất trí nhớ nghe — bởi ông hiểu rằng, dù ký ức đã tan, tình yêu trong tim bà vẫn còn đó ở đâu đó.

Câu chuyện trong cuốn sách ấy là về Noah và Allie — hai tâm hồn gặp nhau vào một mùa hè ở vùng South Carolina những năm 1940. Anh, nghèo khó nhưng đầy nhiệt huyết. Cô, tiểu thư con nhà giàu với tương lai đã được sắp xếp sẵn. Tình yêu của họ nở rộ rực rỡ rồi bị chiến tranh và khoảng cách giai cấp cắt đứt phũ phàng.

Nhưng tình yêu thực sự không chịu khuất phục. Qua những năm tháng xa cách, những bức thư không đến tay, những quyết định nghiệt ngã của số phận — Noah chưa một giây ngừng yêu. Và Allie, dù cuộc đời đã rẽ sang lối khác, vẫn không thể quên đi trái tim đầu tiên của mình.

The Notebook là bộ phim tình cảm kinh điển về tình yêu đủ mạnh để chiến thắng thời gian, tuổi tác và cả sự lãng quên.`,
  },
  {
    title: 'Interstellar',
    description: `Trái Đất đang hấp hối. Những cơn bão bụi tàn phá mùa màng, bầu khí quyển ngày càng mỏng manh, và nhân loại đang đếm ngược những thế hệ cuối cùng có thể tồn tại trên hành tinh này. Cooper — cựu phi công NASA, giờ là nông dân nuôi con — tình cờ khám phá tọa độ của một cơ sở NASA bí mật.

Ở đó, ông được giao sứ mệnh không tưởng: dẫn đầu đội thám hiểm bay qua lỗ sâu đục vũ trụ gần Thổ Tinh, tìm kiếm hành tinh mới có thể cứu rỗi loài người. Nhưng đổi lại, ông phải rời xa đứa con gái Murph — người mà ông hứa sẽ trở về.

Hành trình xuyên không gian đưa họ đến những thế giới kỳ lạ nơi thời gian trôi theo quy luật khác, nơi mỗi giờ trên hành tinh nước có thể tương đương bảy năm trên Trái Đất. Mỗi quyết định mang trọng lượng của hàng tỷ sinh mệnh và tình yêu của một người cha.

Interstellar là thiên sử thi về khoa học và tình người — hỏi rằng điều gì mới thực sự xuyên thấu được không gian và thời gian, và câu trả lời có thể khiến bạn rơi nước mắt.`,
  },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('MongoDB Connected\n');
  let updated = 0;

  for (const item of DESCRIPTIONS) {
    const result = await Movie.updateOne(
      { title: { $regex: new RegExp(item.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
      { $set: { description: item.description } }
    );
    if (result.matchedCount > 0) {
      console.log(`[OK] ${item.title}`);
      updated++;
    } else {
      console.log(`[SKIP] Không tìm thấy: ${item.title}`);
    }
  }

  console.log(`\nĐã cập nhật ${updated}/${DESCRIPTIONS.length} phim.`);
  process.exit(0);
}).catch(e => { console.error('DB error:', e.message); process.exit(1); });
