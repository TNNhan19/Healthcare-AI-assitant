import React, { useEffect, useRef } from 'react';
import { Shield, Users, Award, Heart } from 'lucide-react';
import { motion, useAnimation, useInView } from 'framer-motion';

const AboutPage: React.FC = () => {
  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-gradient-to-br from-blue-500/90 to-teal-400/80 text-[#210060] py-16 md:py-24 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <motion.h1 
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
              >
                Mục tiêu của chúng tôi là chăm sóc sức khỏe giá cả phải chăng cho mọi người.
              </motion.h1>
              <motion.p 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg text-[#210060] leading-relaxed"
              >
                HealthCare được thành lập bởi các dược sĩ địa phương tâm huyết với 20 năm kinh nghiệm trong ngành. 
                Là những dược sĩ bán lẻ, họ hiểu rõ những khó khăn của các gia đình và bạn bè tại quầy thuốc khi họ 
                nhìn thấy những loại thuốc đắt tiền tạo ra gánh nặng tài chính và đôi khi làm trì hoãn việc điều trị 
                do không đủ khả năng chi trả.
              </motion.p>
              <motion.p 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-lg text-[#210060] mt-4 leading-relaxed"
              >
                Sứ mệnh của công ty chúng tôi là giúp người tiêu dùng tiết kiệm. Chúng tôi tin rằng hệ thống chăm sóc sức khỏe 
                cần sự minh bạch và chúng tôi tin tưởng mạnh mẽ vào một hệ thống mang lại cho người tiêu dùng các lựa chọn để 
                so sánh dịch vụ và giá cả.
              </motion.p>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-8"
              >
                <a href="#mission" className="inline-flex items-center gap-2 px-6 py-3 text-base bg-[#210060] hover:bg-[#2c0080] text-white rounded-lg transition-all font-medium">
                  Tìm hiểu thêm
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce"><path d="m6 9 6 6 6-6"/></svg>
                </a>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="order-1 md:order-2 flex justify-center"
            >
              <img 
                src="https://cdn.prod.website-files.com/66ff6c6d11dd23cdd5cfe94f/66ffd5b5dd959b64c12a5e47_quality02.png" 
                alt="Tiết kiệm chi phí chăm sóc sức khỏe" 
                className="w-full max-w-md"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://via.placeholder.com/500x400?text=Hình+ảnh+tiết+kiệm+y+tế";
                }}
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Mission & Vision */}
      <section id="mission" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <span className="inline-block text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Lý do tồn tại</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Mục Đích & Khát Vọng</h2>
              <div className="w-24 h-1 bg-blue-600 mx-auto mt-6"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
                className="bg-gradient-to-br from-blue-50 to-blue-100/70 p-8 md:p-10 rounded-2xl shadow-md relative overflow-hidden border border-blue-100"
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-200/50 rounded-full blur-xl"></div>
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-100/40 rounded-full blur-lg"></div>
                
                <div className="relative">
                  <div className="inline-block p-3 rounded-xl bg-blue-500/10 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  </div>
                  <h2 className="text-3xl font-bold mb-6 text-blue-800">Sứ Mệnh Của Chúng Tôi</h2>
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    Làm cho dịch vụ chăm sóc sức khỏe chất lượng trở nên dễ tiếp cận với mọi người bằng cách cung cấp 
                    các loại thuốc chính hãng, sản phẩm y tế và dịch vụ dược phẩm chuyên nghiệp với tiêu chuẩn 
                    an toàn và chăm sóc cao nhất.
                  </p>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Chúng tôi tin rằng sức khỏe tốt là quyền cơ bản, và chúng tôi cam kết hỗ trợ 
                    hành trình chăm sóc sức khỏe của khách hàng với các sản phẩm đáng tin cậy và hướng dẫn chuyên môn.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
                className="bg-gradient-to-br from-green-50 to-green-100/70 p-8 md:p-10 rounded-2xl shadow-md relative overflow-hidden border border-green-100"
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-200/50 rounded-full blur-xl"></div>
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-green-100/40 rounded-full blur-lg"></div>
                
                <div className="relative">
                  <div className="inline-block p-3 rounded-xl bg-green-500/10 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-700"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <h2 className="text-3xl font-bold mb-6 text-green-800">Tầm Nhìn Của Chúng Tôi</h2>
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    Trở thành nhà cung cấp dịch vụ chăm sóc sức khỏe hàng đầu tại Việt Nam, được công nhận với cam kết về 
                    chất lượng, đổi mới và chăm sóc khách hàng. Chúng tôi hướng đến một tương lai nơi mọi người đều có 
                    quyền tiếp cận thuận tiện với các sản phẩm chăm sóc sức khỏe họ cần.
                  </p>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Thông qua cải tiến liên tục và áp dụng công nghệ mới, chúng tôi phấn đấu thiết lập 
                    các tiêu chuẩn mới trong bán lẻ dược phẩm và dịch vụ chăm sóc sức khỏe.
                  </p>
                </div>
              </motion.div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="absolute w-full h-full inset-0">
          <div className="absolute top-0 right-0 w-1/3 h-64 bg-blue-100/50 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-1/4 h-64 bg-green-100/30 blur-3xl rounded-full"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Điều hướng dẫn chúng tôi</span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Giá Trị Cốt Lõi
            </motion.h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Những nguyên tắc này định hình quyết định, hành động và mối quan hệ của chúng tôi với khách hàng, đối tác và nhau.
            </p>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-6"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Shield className="h-8 w-8 text-white" />,
                color: "blue",
                title: "Tin Cậy & An Toàn",
                description: "Mọi sản phẩm chúng tôi bán đều được cung cấp từ các nhà sản xuất có giấy phép và trải qua kiểm tra chất lượng nghiêm ngặt để đảm bảo an toàn cho bạn."
              },
              {
                icon: <Heart className="h-8 w-8 text-white" />,
                color: "green",
                title: "Quan Tâm & Đồng Cảm",
                description: "Chúng tôi đối xử với mỗi khách hàng bằng sự đồng cảm và hiểu biết, cung cấp dịch vụ chăm sóc cá nhân hóa cho nhu cầu sức khỏe độc đáo của họ."
              },
              {
                icon: <Award className="h-8 w-8 text-white" />,
                color: "purple",
                title: "Sự Xuất Sắc",
                description: "Chúng tôi không ngừng phấn đấu để đạt được sự xuất sắc trong mọi việc làm, từ chất lượng sản phẩm đến dịch vụ khách hàng và chuyên môn nghề nghiệp."
              },
              {
                icon: <Users className="h-8 w-8 text-white" />,
                color: "orange",
                title: "Cộng Đồng",
                description: "Chúng tôi cam kết hỗ trợ sức khỏe và sự khỏe mạnh của các cộng đồng mà chúng tôi phục vụ thông qua giáo dục và chăm sóc sức khỏe dễ tiếp cận."
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white h-full rounded-2xl shadow-md p-8 transition-all duration-300
                               group-hover:shadow-xl group-hover:translate-y-[-5px] border border-gray-100">
                  <div className="flex items-start mb-6">
                    <div className={`${
                      value.color === 'blue' ? 'bg-blue-600' : 
                      value.color === 'green' ? 'bg-green-600' : 
                      value.color === 'purple' ? 'bg-purple-600' : 
                      'bg-orange-600'
                    } p-4 rounded-xl flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110 shadow-lg`}>
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-bold ml-5 mt-3 text-gray-800">{value.title}</h3>
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                  
                  <div className={`w-0 h-1 ${
                      value.color === 'blue' ? 'bg-blue-600' : 
                      value.color === 'green' ? 'bg-green-600' : 
                      value.color === 'purple' ? 'bg-purple-600' : 
                      'bg-orange-600'
                    } mt-6 transition-all duration-300 group-hover:w-full`}></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-28 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0v46.29c47.79 22.2 103.59 32.17 158 28 70.36-5.37 136.33-33.31 206.8-37.5 73.84-4.36 147.54 16.88 218.2 35.26 69.27 18 138.3 24.88 209.4 13.08 36.15-6 69.85-17.84 104.45-29.34C989.49 25 1113-14.29 1200 52.47V0z" fill="#ffffff" fillOpacity=".05" />
            <path d="M0 0v15.81c13 21.11 27.64 41.05 47.69 56.24C99.41 111.27 165 111 224.58 91.58c31.15-10.15 60.09-26.07 89.67-39.8 40.92-19 84.73-46 130.83-49.67 36.26-2.85 70.9 9.42 98.6 31.56 31.77 25.39 62.32 62 103.63 73 40.44 10.79 81.35-6.69 119.13-24.28s75.16-39 116.92-43.05c59.73-5.85 113.28 22.88 168.9 38.84 30.2 8.66 59 6.17 87.09-7.5 22.43-10.89 48-26.93 60.65-49.24V0z" fill="#ffffff" fillOpacity=".05" />
          </svg>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 opacity-10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 opacity-10 rounded-full blur-3xl transform translate-x-1/4 translate-y-1/4"></div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <span className="inline-block text-sm font-semibold text-blue-200 uppercase tracking-wider mb-2">Qua những con số</span>
            <motion.h2
              initial={{ y: -30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Tác Động Của Chúng Tôi
            </motion.h2>
            <p className="text-blue-100 max-w-2xl mx-auto opacity-90">
              Tạo nên sự khác biệt trong cộng đồng trên khắp Việt Nam thông qua dịch vụ chăm sóc sức khỏe dễ tiếp cận
            </p>
            <div className="w-24 h-1 bg-white/40 mx-auto mt-8"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
            {[
              { 
                value: 500, 
                suffix: '+', 
                label: 'Cửa hàng Toàn quốc',
                icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>,
                delay: 0 
              },
              { 
                value: 2, 
                suffix: 'M+', 
                label: 'Khách hàng Phục vụ',
                icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>,
                delay: 0.1 
              },
              { 
                value: 10000, 
                suffix: '+', 
                label: 'Sản phẩm Có sẵn',
                icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>,
                delay: 0.2 
              },
              { 
                value: 20, 
                suffix: '+', 
                label: 'Năm Kinh nghiệm',
                icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
                delay: 0.3 
              }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: stat.delay }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="text-center bg-gradient-to-br from-blue-700/60 to-blue-800/60 backdrop-blur-md rounded-2xl p-8 border border-blue-600/20 shadow-xl"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-full bg-white/10 text-blue-100">
                  {stat.icon}
                </div>
                
                <CounterAnimation 
                  value={stat.value} 
                  suffix={stat.suffix} 
                  className="text-5xl md:text-6xl font-bold mb-3"
                />
                <p className="text-blue-50 text-lg font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-50/50 mask-radial-gradient"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Gặp gỡ chuyên gia</span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Đội Ngũ Lãnh Đạo Của Chúng Tôi
            </motion.h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Các chuyên gia giàu kinh nghiệm tận tâm thúc đẩy sự phát triển chăm sóc sức khỏe và sức khỏe tại Việt Nam
            </p>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-6"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-14">
            {[
              {
                name: "TS. BS. Nguyễn Văn Minh",
                position: "Giám đốc điều hành",
                image: "https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=300",
                description: "Hơn 20 năm trong ngành dược phẩm với niềm đam mê về chăm sóc sức khỏe dễ tiếp cận.",
                socials: [
                  { name: 'LinkedIn', url: '#' },
                  { name: 'Twitter', url: '#' }
                ]
              },
              {
                name: "DS. Trần Thị Lan",
                position: "Giám đốc Dược phẩm",
                image: "https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=300",
                description: "Dẫn dắt đội ngũ lâm sàng của chúng tôi với chuyên môn về quản lý thuốc và chăm sóc bệnh nhân.",
                socials: [
                  { name: 'LinkedIn', url: '#' },
                  { name: 'Twitter', url: '#' }
                ]
              },
              {
                name: "Lê Văn Đức",
                position: "Giám đốc Công nghệ",
                image: "https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=300",
                description: "Thúc đẩy đổi mới công nghệ số để cải thiện khả năng tiếp cận dịch vụ chăm sóc sức khỏe và trải nghiệm khách hàng.",
                socials: [
                  { name: 'LinkedIn', url: '#' },
                  { name: 'Github', url: '#' }
                ]
              }
            ].map((member, index) => (
              <motion.div 
                key={index} 
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300
                               group-hover:shadow-xl border border-gray-100">
                  <div className="relative overflow-hidden">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                      className="h-72 bg-blue-100 overflow-hidden"
                    >
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover transition-transform duration-700"
                      />
                    </motion.div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-900/30 to-transparent 
                                   opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="p-6 w-full flex justify-center space-x-4 mb-4">
                        {member.socials.map((social, idx) => (
                          <a 
                            key={idx}
                            href={social.url}
                            className="bg-white/20 hover:bg-blue-600 p-2 rounded-full backdrop-blur-sm
                                     transition-colors duration-300"
                            aria-label={social.name}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1 text-gray-900 group-hover:text-blue-700 transition-colors">{member.name}</h3>
                    <p className="text-blue-600 font-medium text-sm uppercase tracking-wider mb-3">{member.position}</p>
                    <p className="text-gray-600">{member.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Đảm bảo chất lượng</span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Chứng Nhận & Đối Tác
            </motion.h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Sự tuân thủ của chúng tôi với các tiêu chuẩn quốc tế đảm bảo chúng tôi chỉ cung cấp các sản phẩm và dịch vụ chất lượng cao nhất
            </p>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-6"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: <Shield className="h-10 w-10" />,
                color: "green",
                title: "Được cấp phép bởi Bộ Y tế",
                description: "Được cấp phép đầy đủ và quản lý bởi Bộ Y tế Việt Nam trong lĩnh vực bán lẻ dược phẩm."
              },
              {
                icon: <Award className="h-10 w-10" />,
                color: "blue",
                title: "Chứng nhận ISO 9001:2015",
                description: "Chứng nhận hệ thống quản lý chất lượng quốc tế đảm bảo chất lượng dịch vụ nhất quán."
              },
              {
                icon: <Users className="h-10 w-10" />,
                color: "purple",
                title: "Tiêu chuẩn WHO GMP",
                description: "Tất cả các nhà cung cấp của chúng tôi đều tuân thủ Thực hành Sản xuất Tốt của Tổ chức Y tế Thế giới."
              }
            ].map((cert, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl transform 
                               group-hover:scale-[1.02] transition-transform duration-300 blur-md opacity-50"></div>
                <div className="bg-white p-8 rounded-2xl shadow-lg relative z-10 h-full border border-gray-100
                                transform transition-all duration-300 group-hover:translate-y-[-5px]">
                  <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left mb-6">
                    <motion.div 
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 1 }}
                      className={`${
                        cert.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' : 
                        cert.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 
                        'bg-gradient-to-br from-purple-500 to-purple-600'
                      } w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-md mb-4 md:mb-0 md:mr-6`}
                    >
                      {cert.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900">{cert.title}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {cert.description}
                  </p>
                  <div className={`h-1 w-0 mt-6 group-hover:w-full transition-all duration-500 ${
                    cert.color === 'green' ? 'bg-green-500' : 
                    cert.color === 'blue' ? 'bg-blue-500' : 
                    'bg-purple-500'
                  }`}></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-28 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" fill="none" viewBox="0 0 1463 360">
            <path fill="url(#a)" d="M-277.05 349.913C-277.05 349.913 -191.447 338.027 -163.14 323.07C-134.832 308.112 -129.239 264.847 -72.7834 261.344C-16.3279 257.841 -11.3481 286.921 50.4324 258.385C112.213 229.849 105.707 201.313 165.426 198.354C225.146 195.395 225.146 240.735 309.981 237.776C394.817 234.818 392.613 146.239 491.121 137.061C589.629 127.883 597.771 195.432 673.089 186.254C748.407 177.076 747.046 123.709 811.964 120.75C876.883 117.792 874.243 149.198 945.438 143.28C1016.63 137.363 1007.58 79.7706 1078.78 73.8523C1149.97 67.934 1148.61 98.1266 1203.4 95.1678C1258.2 92.2089 1263.22 35.9092 1324.58 36.0364C1385.93 36.1635 1463 0 1463 0L1463 360L-277.05 360L-277.05 349.913Z" opacity="0.25" />
            <defs>
              <linearGradient id="a" x1="593" x2="593" y1="0" y2="360" gradientUnits="userSpaceOnUse">
                <stop stopColor="white" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute top-20 left-40 w-64 h-64 bg-blue-400/20 blur-3xl rounded-full"></div>
          <div className="absolute -bottom-10 right-20 w-80 h-80 bg-blue-300/10 blur-3xl rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-2/3 text-center lg:text-left"
            >
              <span className="inline-block text-sm font-semibold text-blue-200 uppercase tracking-wider mb-3">Bắt đầu ngay hôm nay</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Sẵn sàng trải nghiệm dịch vụ chăm sóc sức khỏe tốt hơn?</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                Tham gia cùng hàng triệu khách hàng tin tưởng HealthCare cho nhu cầu sức khỏe và sức khỏe của họ.
                Các dược sĩ và chuyên gia chăm sóc sức khỏe của chúng tôi luôn sẵn sàng hỗ trợ bạn.
              </p>
              
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start mt-2"
              >
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  href="/products"
                  className="bg-white text-blue-700 px-8 py-4 rounded-xl font-semibold shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                  Mua sắm ngay
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  href="/contact"
                  className="border-2 border-white bg-transparent hover:bg-white text-white hover:text-blue-700 px-8 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Liên hệ với chúng tôi
                </motion.a>
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block lg:w-1/3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-3xl transform rotate-6 scale-95 opacity-30 blur-lg"></div>
                <div className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20 relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900">Hỗ trợ 24/7</h3>
                      <p className="text-sm text-blue-700">Đội ngũ của chúng tôi luôn sẵn sàng</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-sm text-blue-900 font-medium mb-6">
                    <div className="flex items-center gap-3">
                      <svg className="text-blue-600" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                      Tư vấn chuyên nghiệp
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="text-blue-600" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                      Giao hàng nhanh chóng toàn quốc
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="text-blue-600" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                      Chương trình khách hàng thân thiết
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3 text-sm text-blue-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <span className="font-semibold">Đường dây nóng:</span> 1800-888-999
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Custom CounterAnimation component for animating statistics
interface CounterAnimationProps {
  value: number;
  suffix?: string;
  className?: string;
}

const CounterAnimation: React.FC<CounterAnimationProps> = ({ value, suffix = '', className = '' }) => {
  const [count, setCount] = React.useState(0);
  const counterRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(counterRef, { once: true, margin: "-100px" });
  
  useEffect(() => {
    let startValue = 0;
    let endValue = value;
    let duration = 2000;
    
    if (isInView) {
      let startTime: number | null = null;
      
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const currentValue = Math.floor(progress * (endValue - startValue) + startValue);
        
        setCount(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isInView, value]);
  
  return (
    <div ref={counterRef} className={className}>
      {count}{suffix}
    </div>
  );
};

// Custom FadeInSection component for animating sections
interface FadeInSectionProps {
  children: React.ReactNode;
}

const FadeInSection: React.FC<FadeInSectionProps> = ({ children }) => {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
        hidden: { opacity: 0, y: 30 }
      }}
    >
      {children}
    </motion.div>
  );
};

export default AboutPage;