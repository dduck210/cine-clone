require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Movie = require('../models/Movie');
const Review = require('../models/Review');

// ── Seed reviewer accounts ──────────────────────────────────────────────────
const SEED_USERS = [
    { name: 'Nguyễn Minh Tuấn', email: 'minhtuannguyen@gmail.com' },
    { name: 'Trần Thị Hương', email: 'thuongtran.cine@gmail.com' },
    { name: 'Lê Văn Phúc', email: 'vanphucle@gmail.com' },
    { name: 'Phạm Thùy Linh', email: 'thuylinhpham@gmail.com' },
    { name: 'Hoàng Đức Anh', email: 'ducanh.hoang@gmail.com' },
    { name: 'Võ Thị Thanh', email: 'thanhvo.review@gmail.com' },
    { name: 'Đặng Quốc Huy', email: 'quochuy.dang@gmail.com' },
    { name: 'Bùi Ngọc Mai', email: 'ngocmai.bui@gmail.com' },
    { name: 'Ngô Thị Kim Chi', email: 'kimchi.ngo@gmail.com' },
    { name: 'Dương Văn Tùng', email: 'vantung.duong@gmail.com' },
    { name: 'Lý Thị Bích Ngọc', email: 'bichngoc.ly@gmail.com' },
    { name: 'Trịnh Đình Khải', email: 'dinhkhai.trinh@gmail.com' },
    { name: 'Phan Thị Lan', email: 'thilan.phan@gmail.com' },
    { name: 'Vũ Hồng Sơn', email: 'hongson.vu@gmail.com' },
    { name: 'Mai Thị Thu Hà', email: 'thuha.mai@gmail.com' },
];

// ── Movie-specific reviews ───────────────────────────────────────────────────
const MOVIE_REVIEWS = {
    'Fast X': [
        { rating: 4, comment: 'Phim hành động cuồng nhiệt, cảnh rượt đuổi xe đẹp mắt. Vin Diesel vẫn rất ngầu dù tuổi cao. Villain lần này hay hơn hẳn các phần trước!' },
        { rating: 3, comment: 'Cốt truyện hơi thiếu logic nhưng cảnh quay hoành tráng bù đắp được. Xem cho vui là ổn, đừng quá suy nghĩ.' },
        { rating: 5, comment: 'Tuyệt vời! Javier Bardem đóng vai phản diện quá đỉnh. Cảnh cuối phim gây sốc thật sự, mong chờ phần 11.' },
        { rating: 4, comment: 'Một phim bom tấn đúng nghĩa. Đặc biệt cảnh ở Rome rất ấn tượng. Nhạc nền cũng rất xịn.' },
        { rating: 3, comment: 'Vẫn như các phần trước, nhiều cảnh vô lý nhưng xem được. Thích hợp xem cuối tuần với bạn bè.' },
    ],
    'Mission: Impossible – Dead Reckoning': [
        { rating: 5, comment: 'Tom Cruise liều mạng thật sự khiến mình nổi da gà. Cảnh trên tàu hỏa là đỉnh cao của điện ảnh hành động. Xứng đáng 5 sao!' },
        { rating: 5, comment: 'Phim hành động hay nhất năm! Không có CGI quá đà, toàn là stunts thật. Tom Cruise là huyền thoại.' },
        { rating: 4, comment: 'Cốt truyện về AI khá thú vị và phù hợp thời đại. Cảnh hành động đỉnh như mọi khi. Hơi dài nhưng không buồn ngủ.' },
        { rating: 4, comment: 'Hayley Atwell gia nhập series rất tốt. Nhịp phim nhanh, nhiều twist bất ngờ. Mong chờ phần kế tiếp.' },
        { rating: 3, comment: 'Hay nhưng hơi phức tạp về cốt truyện. Những ai không xem các phần trước có thể bị lạc.' },
    ],
    'John Wick: Chapter 4': [
        { rating: 5, comment: 'Choreography đánh nhau đỉnh nhất mọi thời đại! Cảnh ở Paris như một bản nhạc nghệ thuật. Keanu Reeves sinh ra để đóng vai này.' },
        { rating: 5, comment: 'Phần này vượt tất cả các phần trước. Cảnh stairs là kiệt tác điện ảnh. Buồn vì kết thúc như vậy nhưng rất xứng đáng.' },
        { rating: 4, comment: 'Bill Skarsgård là một phản diện xuất sắc. Phim dài nhưng không có phút nào nhàm chán.' },
        { rating: 5, comment: 'Mình đã xem 4 lần rồi vẫn không chán. Đây là bộ phim hành động hoàn hảo nhất mình từng xem.' },
        { rating: 4, comment: 'Cảnh Donnie Yen vừa đánh vừa đọc kinh cầu nguyện quá hài và ngầu cùng lúc. Phim rất giải trí.' },
    ],
    'Guardians of the Galaxy Vol. 3': [
        { rating: 5, comment: 'Rocket\'s backstory làm mình khóc không ngừng. James Gunn tạo ra một kết thúc hoàn hảo cho trilogy này. Cảm ơn anh ấy!' },
        { rating: 5, comment: 'Phần hay nhất trong trilogy! Cảm xúc vô cùng mãnh liệt. High Evolutionary là villain đáng sợ theo cách khác.' },
        { rating: 4, comment: 'Soundtrack như thường lệ xuất sắc. Story của Rocket rất xúc động. Phim hay hơn mình mong đợi.' },
        { rating: 4, comment: 'Hài hước, cảm động, hành động đầy đủ. Đây là cách kết thúc đúng nghĩa cho một nhóm anh hùng đặc biệt.' },
        { rating: 3, comment: 'Hay nhưng hơi dài và đôi chỗ chậm. Phần kết cho các nhân vật khá thỏa mãn.' },
    ],
    'Deadpool & Wolverine': [
        { rating: 5, comment: 'Fan service hoàn hảo! Deadpool và Wolverine cùng màn ảnh quá tuyệt. Ryan Reynolds và Hugh Jackman chemistry cực đỉnh.' },
        { rating: 5, comment: 'Hài hước tục tĩu đúng chất Deadpool nhưng vẫn có chiều sâu cảm xúc. Post-credit scene cũng bá đạo.' },
        { rating: 4, comment: 'Nhiều cameo bất ngờ làm rạp vỡ lên. Cốt truyện không quá phức tạp nhưng rất vui.' },
        { rating: 4, comment: 'Mình xem lúc nửa đêm vẫn thức tỉnh cười liên tục. Deadpool làm gì cũng buồn cười.' },
        { rating: 3, comment: 'Vui nhưng hơi quá nhiều references và fan service. Người không biết MCU sẽ khó theo.' },
    ],
    'Captain America: Brave New World': [
        { rating: 3, comment: 'Anthony Mackie ok nhưng chưa thuyết phục bằng Chris Evans. Cốt truyện khá đơn giản, Red Hulk không đủ đe dọa.' },
        { rating: 4, comment: 'Tốt hơn mình dự đoán! Sam Wilson có bản sắc riêng và không cố bắt chước Steve Rogers. Hành động ổn.' },
        { rating: 2, comment: 'Phần này khá nhạt so với MCU trước đây. Villain thiếu chiều sâu, cốt truyện đoán được.' },
        { rating: 3, comment: 'Xem được nhưng không ấn tượng. Được mỗi Harrison Ford là điểm cộng.' },
    ],
    'Aquaman and the Lost Kingdom': [
        { rating: 3, comment: 'Kỹ xảo đẹp nhưng phim không hay. DCEU đang hấp hối thật rồi. Jason Momoa cố hết sức nhưng cốt truyện không ủng hộ.' },
        { rating: 2, comment: 'Nhàm chán, cốt truyện sơ sài. Chỉ xứng đáng xem nếu không có gì xem.' },
        { rating: 3, comment: 'Vui vẻ nhẹ nhàng thôi, đừng mong đợi gì nhiều. Underwater CGI vẫn đẹp.' },
        { rating: 2, comment: 'Đây là lý do DCEU thất bại. Thiếu tầm nhìn, thiếu nhân vật, thiếu mọi thứ.' },
    ],
    'Thunderbolts*': [
        { rating: 4, comment: 'Bất ngờ tốt hơn mình nghĩ! Florence Pugh xuất sắc và storyline về trauma rất hay. Marvel đang hồi phục.' },
        { rating: 4, comment: 'Phim tập trung vào nhân vật hơn là action, đây là điểm cộng lớn. Rất fresh so với MCU gần đây.' },
        { rating: 3, comment: 'Hay nhưng chưa đặc biệt. Nhóm nhân vật thú vị nhưng potential chưa được khai thác hết.' },
        { rating: 5, comment: 'MCU đã trở lại! Bob là nhân vật mới hay nhất từ khi Endgame kết thúc. Xem ngay đi!' },
    ],
    'Godzilla x Kong: The New Empire': [
        { rating: 4, comment: 'Titan vs Titan action cực kỳ mãn nhãn! Brain không cần hoạt động nhiều, chỉ cần thưởng thức màn hình lớn.' },
        { rating: 3, comment: 'Phần Kong với khỉ nhỏ dễ thương lắm. Human story vẫn nhàm chán như mấy phần trước.' },
        { rating: 4, comment: 'Bật âm lượng lớn, lấy bắp rang bơ và tận hưởng thôi! Đây không phải phim nghệ thuật nhưng rất giải trí.' },
        { rating: 2, comment: 'Khủng long đánh nhau thì ok nhưng cốt truyện con người quá tệ và nhàm.' },
    ],
    'Kingdom of the Planet of the Apes': [
        { rating: 4, comment: 'Khởi đầu hay cho chapter mới. Noa là nhân vật chính được xây dựng tốt. Proximus Caesar là villain thú vị.' },
        { rating: 5, comment: 'Trilogie đầu đã đỉnh, phần reboot này cũng không kém. Thế giới post-apocalypse được xây dựng rất công phu.' },
        { rating: 4, comment: 'CGI vượt trội, khỉ nhìn như thật. Storyline đặt ra nhiều câu hỏi về xã hội rất thú vị.' },
        { rating: 3, comment: 'Hay nhưng thiếu cái gì đó so với trilogy Andy Serkis. Dù sao cũng đáng xem.' },
    ],
    'Dune: Part Two': [
        { rating: 5, comment: 'Denis Villeneuve là thiên tài! Visuals, âm nhạc, diễn xuất tất cả đều hoàn hảo. Phim hay nhất trong nhiều năm qua.' },
        { rating: 5, comment: 'Zendaya cuối cùng có nhiều cảnh hơn! Austin Butler đóng Feyd-Rautha lạnh lùng và đáng sợ. Không thể không yêu phim này.' },
        { rating: 5, comment: 'Phòng chiếu IMAX không đủ lớn cho phim này. Mọi khung hình đều là nghệ thuật. Hans Zimmer làm âm nhạc tuyệt vời.' },
        { rating: 4, comment: 'Hơi chậm ở đầu nhưng nửa sau phim thì quá đỉnh. Cảnh trên cát với worm riding wow thật sự.' },
        { rating: 5, comment: 'Đây là lý do điện ảnh tồn tại. Một trải nghiệm xem phim hiếm có. 10/10 không cần bàn.' },
    ],
    'Oppenheimer': [
        { rating: 5, comment: 'Christopher Nolan làm ra một kiệt tác về lịch sử. Cillian Murphy xứng đáng Oscar. Âm thanh bom nguyên tử trong rạp khiến tim mình đập mạnh.' },
        { rating: 5, comment: 'Phim dài 3 tiếng nhưng không thấy mệt chút nào. Cấu trúc phi tuyến tính rất thú vị. Đây là phim của năm không phải bàn.' },
        { rating: 4, comment: 'Rất hay và thông minh nhưng cần xem lại để hiểu hết. Lần đầu xem bị cuốn vào câu chuyện quá nên bỏ lỡ nhiều chi tiết.' },
        { rating: 4, comment: 'Robert Downey Jr đóng Strauss quá xuất sắc, xứng đáng Oscar hơn. Phim nặng về thoại nhưng không nhàm.' },
        { rating: 3, comment: 'Hay nhưng quá dài và phức tạp. Cần biết trước lịch sử một chút mới hiểu hết được.' },
    ],
    'Transformers: Rise of the Beasts': [
        { rating: 3, comment: 'Hay hơn mấy phần của Michael Bay! Maximals đẹp mắt. Cốt truyện đơn giản nhưng khán giả gia đình sẽ thích.' },
        { rating: 4, comment: 'Bumblebee spinoff vẫn tốt hơn nhưng phần này cũng không tệ. Optimus Primal rất ngầu.' },
        { rating: 2, comment: 'Vẫn chỉ là tiếng nổ và xe biến hình. Tình tiết yếu, nhân vật thiếu chiều sâu.' },
        { rating: 3, comment: 'Đưa trẻ con đi xem thì hợp. Người lớn thì vừa đủ để không buồn ngủ.' },
    ],
    'Alien: Romulus': [
        { rating: 5, comment: 'Đây là Alien tôi chờ đợi! Kinh dị, căng thẳng, không có phút nào thở được. Fede Álvarez làm cực tốt việc kết hợp Alien 1 và 2.' },
        { rating: 5, comment: 'Atmosphere kinh dị đặc trưng của Alien quay trở lại. Cailee Spaeny xuất sắc. Nhân vật Andy gây tranh cãi nhưng mình thích.' },
        { rating: 4, comment: 'Scary movie tốt nhất năm nay. Xem xong về nhà không dám tắt đèn. Đúng chất Alien nguyên bản.' },
        { rating: 4, comment: 'CGI Facehugger đẹp kinh dị. Cốt truyện đơn giản nhưng execution hoàn hảo. Đây là cách làm Alien đúng.' },
        { rating: 3, comment: 'Hay nhưng có vài plot holes. Nhìn chung là bom tấn hè đáng xem, đặc biệt nếu thích kinh dị sci-fi.' },
    ],
    'Smile 2': [
        { rating: 4, comment: 'Đáng sợ hơn phần 1! Naomi Scott diễn xuất rất tốt. Cảnh concert cuối phim là nightmare fuel thật sự.' },
        { rating: 3, comment: 'Kinh dị tốt nhưng phần 1 hay hơn. Vẫn đáng xem nếu thích thể loại này.' },
        { rating: 4, comment: 'Atmosphere ám ảnh và khó chịu theo cách đúng của kinh dị tâm lý. Không giật me nhiều mà đáng sợ theo kiểu khác.' },
        { rating: 2, comment: 'Phần 1 hay hơn nhiều. Phần này không có gì đặc biệt, quá nhiều jump scare rẻ tiền.' },
    ],
    'A Quiet Place: Day One': [
        { rating: 4, comment: 'Prequel hay và mang góc nhìn khác so với 2 phần chính. Lupita Nyong\'o diễn xuất cảm xúc không cần thoại.' },
        { rating: 5, comment: 'Cảnh New York trong ngày đầu xâm lăng kinh hoàng và hoành tráng. Phim ngắn nhưng dense, từng giây đều có giá trị.' },
        { rating: 3, comment: 'Hay nhưng tension không đỉnh bằng 2 phần gốc. Nhân vật mèo là highlight của phim.' },
        { rating: 4, comment: 'Concept Quiet Place vẫn hiệu quả. Framing khác biệt và tươi mới. Một phần mở rộng xứng đáng.' },
    ],
    'The Substance': [
        { rating: 5, comment: 'Body horror điên rồ nhất mình từng xem. Demi Moore và Margaret Qualley đóng tuyệt. Đây là phim về body image và nỗi sợ già đi rất sâu sắc.' },
        { rating: 4, comment: 'Không phải phim cho tất cả mọi người nhưng nếu bạn thích arthouse horror thì đây là kiệt tác. Phần cuối sẽ ám ảnh mãi.' },
        { rating: 3, comment: 'Thú vị nhưng hơi quá dài và exaggerated. Metaphor về xã hội rõ ràng đến mức gần clichê.' },
        { rating: 5, comment: 'Cannes Jury Prize xứng đáng! Phim phê phán rất thẳng thắn về cách xã hội nhìn nhận phụ nữ lớn tuổi. Guts to make this film.' },
        { rating: 4, comment: 'Disgusting theo cách art film. Coralie Fargeat có vision rõ ràng. Không dành cho người yếu bụng nhưng đáng xem.' },
    ],
    'Barbie': [
        { rating: 5, comment: 'Thông minh hơn tôi tưởng nhiều! Bình luận về xã hội, nữ quyền, và bản sắc con người rất sâu sắc. Margot Robbie hoàn hảo.' },
        { rating: 4, comment: 'Vừa hài hước vừa có chiều sâu. Ryan Gosling là bất ngờ lớn nhất, Ken bá đạo không tưởng. Bài hát I\'m Just Ken quá hay.' },
        { rating: 4, comment: 'Màu sắc rực rỡ, costumes tuyệt vời và câu chuyện ý nghĩa. Không phải phim trẻ em đơn thuần đâu nhé.' },
        { rating: 3, comment: 'Nửa đầu hay, nửa sau hơi dài dòng. Nhìn chung là trải nghiệm vui và độc đáo.' },
        { rating: 5, comment: 'Xem lại lần 2 vẫn thích. Greta Gerwig tài năng thật sự. Phim không chỉ cho trẻ em mà người lớn cũng sẽ thấy rất nhiều điều.' },
    ],
    'Inside Out 2': [
        { rating: 5, comment: 'Pixar lại làm tôi khóc rồi! Anxiety được thể hiện rất chân thực. Phụ huynh và con cái đều nên xem bộ phim này.' },
        { rating: 5, comment: 'Phần về teenage anxiety hay hơn phần 1 theo nhiều cách. Cảm giác nhìn thấy mình trong Riley rất mạnh mẽ.' },
        { rating: 4, comment: 'Sáng tạo, vui nhộn và đầy cảm xúc. Ennui là cảm xúc mới funny nhất. Phim gia đình xuất sắc.' },
        { rating: 4, comment: 'Anxiety character được thiết kế và diễn đạt hoàn hảo. Bao nhiêu phụ huynh đưa con đi xem và tự thấy mình trong đó.' },
        { rating: 3, comment: 'Hay nhưng không bằng phần 1 về mặt emotional impact. Vẫn là phim Pixar tốt và đáng xem.' },
    ],
    'Moana 2': [
        { rating: 4, comment: 'Bài hát hay, visuals đẹp, Moana vẫn là nhân vật đáng yêu. Maui có ít cảnh hơn nhưng vẫn hài hước.' },
        { rating: 3, comment: 'Okay nhưng không bằng phần đầu về mặt câu chuyện. Hợp xem cuối tuần với gia đình.' },
        { rating: 4, comment: 'Các em nhỏ rất thích! Animation đẹp hơn phần 1. Nhân vật mới thú vị.' },
        { rating: 5, comment: 'Disney animation đỉnh như thường lệ. Cảnh biển rực rỡ và sống động không ngờ. Con gái mình đòi xem lại ngay khi ra ngoài.' },
        { rating: 3, comment: 'Không có nhiều bất ngờ so với phần 1 nhưng vẫn là phim hay cho gia đình.' },
    ],
    'Sonic the Hedgehog 3': [
        { rating: 4, comment: 'Shadow the Hedgehog ngầu hơn mình nghĩ! Keanu Reeves lồng tiếng rất phù hợp. Phim hài hước và action tốt.' },
        { rating: 5, comment: 'Phần hay nhất trong trilogy! Jim Carrey trở lại với Doctor Robotnik điên đảo hơn bao giờ hết.' },
        { rating: 4, comment: 'Đưa bọn nhóc đi xem mà cả bố lẫn con đều cười xuyên suốt. Phim gia đình rất giải trí.' },
        { rating: 3, comment: 'Vui nhưng không có gì đặc biệt. Hợp với fan Sonic hoặc xem với trẻ em.' },
    ],
    'Wicked': [
        { rating: 5, comment: 'Ariana Grande và Cynthia Erivo là sự kết hợp hoàn hảo! Defying Gravity cảnh cuối làm tôi nổi da gà. Production design tuyệt vời.' },
        { rating: 5, comment: 'Musical của năm! Mình đã xem Broadway rồi mà vẫn bị phim cuốn hoàn toàn. Visuals lộng lẫy ngoài sức tưởng tượng.' },
        { rating: 4, comment: 'Dài nhưng không chán. Câu chuyện về tình bạn và thiên kiến rất hay. Hát live thật mà không bị giảm chất.' },
        { rating: 4, comment: 'Không cần biết gì về Broadway vẫn xem hiểu hết. Nhạc hay, diễn xuất tốt, câu chuyện cảm động.' },
        { rating: 3, comment: 'Hay nhưng hơi dài. Biết là phần 1 rồi nhưng kết hơi đột ngột. Mong phần 2 ra sớm.' },
    ],
    'It Ends with Us': [
        { rating: 4, comment: 'Blake Lively diễn cảm xúc rất tốt. Câu chuyện về domestic violence được xử lý tinh tế. Phim làm tôi suy nghĩ nhiều.' },
        { rating: 5, comment: 'Phim quan trọng và cần thiết. Nhiều phụ nữ sẽ nhìn thấy bản thân trong câu chuyện của Lily.' },
        { rating: 3, comment: 'Cốt truyện hay nhưng chemistry của Blake và Justin Baldoni không đủ mạnh trên màn ảnh.' },
        { rating: 4, comment: 'Cảm động và mạnh mẽ. Ending không như tôi mong đợi nhưng rất thực tế và đúng đắn.' },
    ],
    'Killers of the Flower Moon': [
        { rating: 5, comment: 'Scorsese vẫn là bậc thầy! Leonardo DiCaprio và Lily Gladstone tuyệt vời. 3.5 tiếng nhưng không thấy chán vì bị cuốn hoàn toàn.' },
        { rating: 5, comment: 'Lịch sử tăm tối của nước Mỹ được kể lại với sự tôn trọng và chân thực. Lily Gladstone xứng đáng Oscar hơn ai hết.' },
        { rating: 4, comment: 'Phim rất hay nhưng phải có tâm thế chuẩn bị xem phim nghiêm túc. Không phải blockbuster nhưng là tác phẩm lớn.' },
        { rating: 4, comment: 'Robert De Niro đóng villain đáng sợ và đáng ghét đến mức muốn nhảy vào màn hình.' },
        { rating: 3, comment: 'Hay nhưng quá dài. Cần xem khi tỉnh táo hoàn toàn mới appreciate được.' },
    ],
    'Kẻ Ăn Hồn': [
        { rating: 4, comment: 'Phim kinh dị Việt Nam chất lượng cao! Không gian làng quê ám ảnh. Diễn xuất tốt và cốt truyện về văn hóa tâm linh rất độc đáo.' },
        { rating: 5, comment: 'Tự hào là phim Việt Nam có thể cạnh tranh với phim kinh dị quốc tế. Áp lực từ đầu đến cuối.' },
        { rating: 3, comment: 'Khởi đầu hay nhưng giải thích ở nửa sau hơi lộn xộn. Dù sao cũng ủng hộ phim Việt Nam!' },
        { rating: 4, comment: 'Kết hợp folklore Việt Nam và kinh dị hiện đại rất tốt. Cảnh quay đẹp và đáng sợ đúng chỗ.' },
    ],
    'Nhà Bà Nữ': [
        { rating: 5, comment: 'Phim Tết hay nhất từ trước đến nay! Cười từ đầu đến cuối nhưng xem xong thấy ấm lòng. Gia đình Việt Nam quá chân thực.' },
        { rating: 5, comment: 'Kaity Nguyễn và NSND Hồng Vân diễn xuất đỉnh. Đây là kiệt tác điện ảnh Việt Nam đương đại.' },
        { rating: 4, comment: 'Hài hước mà không vulgar. Câu chuyện về gia đình đa thế hệ rất gần gũi với người Việt.' },
        { rating: 4, comment: 'Đưa gia đình đi xem ai cũng thích. Bà Nữ và mấy cô con dâu hài hết nước chấm.' },
        { rating: 4, comment: 'Phim Việt Nam hiếm khi làm được như này. Vừa hài vừa có nước mắt, rất hoàn chỉnh.' },
    ],
    'Em và Trịnh': [
        { rating: 4, comment: 'Nhạc Trịnh Công Sơn luôn đẹp. Avin Lu diễn tốt vai nhạc sĩ trẻ. Câu chuyện tình yêu và âm nhạc cảm động.' },
        { rating: 3, comment: 'Hay nhưng hơi dàn trải quá nhiều câu chuyện tình. Phần âm nhạc là điểm sáng lớn nhất.' },
        { rating: 4, comment: 'Một bức tranh đẹp về Sài Gòn xưa và tài năng của Trịnh Công Sơn. Ai yêu nhạc Trịnh nên xem.' },
        { rating: 5, comment: 'Phim làm tôi nghe lại toàn bộ nhạc Trịnh sau khi xem. Đây là sự tôn vinh xứng đáng cho ông.' },
    ],
};

// ── Genre-based fallback reviews ────────────────────────────────────────────
const GENRE_REVIEWS = {
    'Action': [
        { rating: 4, comment: 'Phim hành động hay, nhiều cảnh đánh nhau mãn nhãn. Xem ở rạp với âm thanh lớn thú vị hơn nhiều.' },
        { rating: 3, comment: 'Cảnh quay ổn, diễn viên diễn tốt. Cốt truyện không có gì đặc biệt nhưng xem giải trí được.' },
        { rating: 4, comment: 'Bom tấn đúng nghĩa! Kỹ xảo đỉnh và nhịp phim nhanh. Đáng xem ở rạp lớn.' },
        { rating: 5, comment: 'Một trong những phim hành động hay nhất mình từng xem. Đáng từng đồng tiền mua vé.' },
        { rating: 3, comment: 'Vui nhộn và giải trí. Không cần suy nghĩ nhiều, chỉ cần thưởng thức cảnh quay hoành tráng.' },
    ],
    'Sci-Fi': [
        { rating: 4, comment: 'Khoa học viễn tưởng được thực hiện đúng cách. Visual effects đặc sắc và concept story thú vị.' },
        { rating: 5, comment: 'Phim sci-fi tuyệt vời với world-building chi tiết. Một trải nghiệm điện ảnh thực sự.' },
        { rating: 3, comment: 'Ý tưởng hay nhưng thực hiện chưa đến nơi. Vẫn đáng xem nếu thích thể loại này.' },
        { rating: 4, comment: 'CGI đẹp mắt và câu chuyện sáng tạo. Sci-fi fan sẽ rất hài lòng.' },
    ],
    'Horror': [
        { rating: 4, comment: 'Phim kinh dị làm tốt! Atmosphere ám ảnh và nhiều cảnh khiến tim đập mạnh.' },
        { rating: 3, comment: 'Scary nhưng hơi nhiều jump scare quá. Vẫn đáng xem nếu thích bị hù.' },
        { rating: 5, comment: 'Kinh dị đỉnh cao! Xem xong về nhà không dám tắt đèn. Rất recommend!' },
        { rating: 4, comment: 'Hồi hộp từ đầu đến cuối. Đặc biệt nên xem ở rạp để trải nghiệm âm thanh tốt nhất.' },
        { rating: 2, comment: 'Hơi clichê nhưng dân ghiền kinh dị vẫn xem được. Cần cải thiện cốt truyện hơn.' },
    ],
    'Comedy': [
        { rating: 4, comment: 'Hài hước và giải trí! Phim gia đình lý tưởng cho cuối tuần. Cả già lẫn trẻ đều cười.' },
        { rating: 5, comment: 'Cười từ đầu đến cuối! Diễn viên rất duyên và timing comedy hoàn hảo.' },
        { rating: 3, comment: 'Vui vẻ nhẹ nhàng. Không phải masterpiece nhưng xem thư giãn rất tốt.' },
        { rating: 4, comment: 'Một bộ phim hài hiếm hoi mà cả gia đình đều thích. Đáng đồng tiền mua vé.' },
    ],
    'Drama': [
        { rating: 4, comment: 'Câu chuyện cảm xúc và diễn xuất chân thực. Phim khiến tôi suy nghĩ nhiều sau khi xem xong.' },
        { rating: 5, comment: 'Drama hay nhất năm! Nhân vật được xây dựng sâu sắc và cốt truyện rất xúc động.' },
        { rating: 3, comment: 'Hay nhưng hơi chậm. Dành cho người thích phim nghệ thuật hơn là blockbuster.' },
        { rating: 4, comment: 'Diễn xuất tuyệt vời từ toàn bộ dàn diễn viên. Một bộ phim chín chắn và đáng xem.' },
    ],
    'Romance': [
        { rating: 4, comment: 'Lãng mạn và xúc động. Đưa người yêu đi xem là hoàn hảo. Chemistry của hai diễn viên chính rất tốt.' },
        { rating: 3, comment: 'Câu chuyện tình yêu ổn dù hơi đoán được. Vẫn đáng xem nếu thích romance.' },
        { rating: 5, comment: 'Phim tình cảm hay nhất gần đây! Cảm xúc chân thực và kết thúc thỏa mãn.' },
        { rating: 4, comment: 'Vừa cười vừa khóc trong suốt phim. Diễn viên diễn tự nhiên và đáng yêu.' },
    ],
};

function shuffle(arr) {
    return arr.slice().sort(() => Math.random() - 0.5);
}

async function getOrCreateUser(userData) {
    let user = await User.findOne({ email: userData.email });
    if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash('Cine@2024!', salt);
        user = await User.create({
            name: userData.name,
            email: userData.email,
            password: hashed,
            isVerified: true,
            role: 'user',
        });
        console.log(`  Created user: ${userData.name}`);
    }
    return user;
}

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        // Create seed users
        console.log('\n── Creating seed users ──');
        const users = [];
        for (const ud of SEED_USERS) {
            const u = await getOrCreateUser(ud);
            users.push(u);
        }
        console.log(`Total reviewers: ${users.length}`);

        // Get all now_showing movies
        const movies = await Movie.find({ status: 'now_showing' }).lean();
        console.log(`\n── Found ${movies.length} now_showing movies ──`);

        let totalAdded = 0;
        let totalSkipped = 0;

        for (const movie of movies) {
            const existingCount = await Review.countDocuments({ movie: movie._id });
            if (existingCount >= 8) {
                console.log(`  SKIP  "${movie.title}" — already has ${existingCount} reviews`);
                totalSkipped++;
                continue;
            }

            // Get movie-specific or genre-based reviews
            const specificReviews = MOVIE_REVIEWS[movie.title] || [];
            const genreName = movie.genre?.name || '';
            const fallbackPool = GENRE_REVIEWS[genreName] || GENRE_REVIEWS['Action'];

            // Merge and deduplicate review content
            let reviewPool = [...specificReviews];
            for (const fb of shuffle(fallbackPool)) {
                if (reviewPool.length >= 8) break;
                reviewPool.push(fb);
            }

            // Shuffle users and reviews
            const shuffledUsers = shuffle(users);
            const targetCount = Math.min(reviewPool.length, shuffledUsers.length, 7);

            let addedForMovie = 0;
            for (let i = 0; i < targetCount; i++) {
                const user = shuffledUsers[i];
                const reviewData = reviewPool[i];

                // Skip if this user already reviewed this movie
                const exists = await Review.findOne({ user: user._id, movie: movie._id });
                if (exists) continue;

                try {
                    await Review.create({
                        user: user._id,
                        movie: movie._id,
                        rating: reviewData.rating,
                        comment: reviewData.comment,
                        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                    });
                    addedForMovie++;
                    totalAdded++;
                } catch (e) {
                    if (e.code !== 11000) console.error(`    Error: ${e.message}`);
                }
            }

            // Recalculate movie rating
            const agg = await Review.aggregate([
                { $match: { movie: movie._id } },
                { $group: { _id: null, avg: { $avg: '$rating' } } },
            ]);
            const newRating = agg.length ? Math.round(agg[0].avg * 10) / 10 : movie.rating;
            await Movie.findByIdAndUpdate(movie._id, { rating: newRating });

            console.log(`  +${addedForMovie} reviews  "${movie.title}" → rating: ${newRating}`);
        }

        console.log(`\n── Done ──`);
        console.log(`Added: ${totalAdded} reviews`);
        console.log(`Skipped: ${totalSkipped} movies (already have ≥8 reviews)`);

    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

run();
