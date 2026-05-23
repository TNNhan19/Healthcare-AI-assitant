const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    // 1. Đọc file JSON sản phẩm cũ
    let productsData = [];
    try {
        productsData = JSON.parse(fs.readFileSync('hotrotieuhoa.json', 'utf-8'));
        console.log(`Đã đọc ${productsData.length} sản phẩm từ file hotrotieuhoa.json.`);
    } catch (e) {
        console.error('Lỗi: Không thể đọc file hotrotieuhoa.json. Đảm bảo file tồn tại và có định dạng JSON hợp lệ.');
        return;
    }

    const browser = await puppeteer.launch({ headless: true, protocolTimeout: 180000 });
    const page = await browser.newPage();

    // 2. Truy cập vào trang web bạn chỉ định để lấy các link sản phẩm theo thứ tự
    const targetUrl = 'https://www.nhathuocankhang.com/ho-tro-tieu-hoa#c=7016&o=7&pi=2';
    console.log(`Đang mở trang danh sách sản phẩm: ${targetUrl}`);
    await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    // 3. Tải tất cả sản phẩm trên trang
    let hasMore = true;
    while (hasMore) {
        try {
            const loadMore = await page.$('a[href="javascript:;"]');
            const remain = await page.$eval('span.remain', span => parseInt(span.innerText.trim()) || 0);
            if (loadMore && remain > 5) {
                console.log(`Tải thêm sản phẩm... còn ${remain}`);
                await loadMore.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                hasMore = false;
                console.log('Đã tải hết sản phẩm.');
            }
        } catch (err) {
            console.error('Lỗi khi nhấn "Xem thêm":', err);
            hasMore = false;
        }
    }

    // 4. Lấy danh sách link sản phẩm theo thứ tự hiển thị
    console.log('Lấy danh sách link sản phẩm...');
    const productLinks = await page.evaluate(() =>
        Array.from(document.querySelectorAll('li.item.oneUnit a')).map(a => a.href)
    );
    await page.close();
    
    console.log(`Tổng sản phẩm trên trang: ${productLinks.length}`);
    if (productsData.length !== productLinks.length) {
        console.warn('Cảnh báo: Số lượng sản phẩm trong file JSON không khớp với số lượng trên trang web.');
    }

    // 5. Hàm xử lý logic lấy chi tiết cho một sản phẩm duy nhất
    const processProduct = async (product, link) => {
    // Kiểm tra nếu đã có đủ dữ liệu thì bỏ qua
    if (product.details && Object.keys(product.details).length > 0 && product.product_info) {
        console.log(`[BỎ QUA] Sản phẩm "${product.name}" đã có đủ dữ liệu.`);
        return product;
    }

    let productPage; // Khai báo page ở ngoài để có thể truy cập trong finally
    try {
        productPage = await browser.newPage();
        await productPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log(`[ĐANG XỬ LÝ] Sản phẩm: ${product.name}`);
        
        // --- Mở Pop-up ---
        // Sử dụng page.waitForSelector để đảm bảo nút tồn tại trước khi click
        const openPopupSelector = 'div.itemtab[data-click="gallery-shortdescription"], div.itemtab[data-click="gallery-article"]';
        try {
            await productPage.waitForSelector(openPopupSelector, { timeout: 15000 });
            await productPage.click(openPopupSelector);
        } catch (e) {
            console.warn(`[CẢNH BÁO] Không tìm thấy nút mở pop-up cho sản phẩm: ${product.name}. Bỏ qua sản phẩm này.`);
            return product; // Trả về sản phẩm không thay đổi
        }

        // Chờ pop-up container xuất hiện và hiển thị
        await productPage.waitForSelector('.popup-slidearea.popup-vs', { visible: true, timeout: 20000 });
        
        // --- Lấy Details (Đặc điểm nổi bật) ---
        if (!product.details || Object.keys(product.details).length === 0) {
            const detailsTabSelector = 'li[data-tab="gallery-shortdescription"]';
            const detailsContentSelector = '.popup-slidearea.popup-vs .content-tab[data-show="gallery-shortdescription"]';
            
            try {
                // Chờ tab "Đặc điểm nổi bật" xuất hiện rồi mới click
                const detailsTab = await productPage.waitForSelector(detailsTabSelector, { visible: true, timeout: 10000 });
                await detailsTab.click();
                
                // <<< THAY ĐỔI QUAN TRỌNG: Chờ nội dung của tab hiển thị
                await productPage.waitForSelector(detailsContentSelector, { visible: true, timeout: 20000 });

                product.details = await productPage.evaluate((selector) => {
                    const allDetails = {};
                    const detailList = document.querySelector(selector + ' ul.deslist.scrollgallery');
                    if (detailList) {
                        detailList.querySelectorAll('li').forEach(item => {
                            const key = item.querySelector('b')?.innerText.trim();
                            const val = item.querySelector('.des-infor-content')?.innerText.trim();
                            if (key && val) {
                                allDetails[key] = val;
                            }
                        });
                    }
                    return allDetails;
                }, detailsContentSelector); // Truyền selector vào evaluate
                console.log(`\t✓ Lấy 'details' thành công cho: ${product.name}`);

            } catch (e) {
                // Nếu không tìm thấy tab hoặc nội dung, ghi nhận và tiếp tục
                if (e.name === 'TimeoutError') {
                     console.warn(`\t[LỖI TIMEOUT] Không thể tải nội dung 'details' cho: ${product.name}.`);
                } else {
                     console.warn(`\t[LỖI] Không tìm thấy tab/nội dung 'details' cho: ${product.name}.`);
                }
                product.details = {}; // Gán object rỗng để không thử lại lần sau
            }
        } else {
            console.log(`\t→ 'details' đã tồn tại cho: ${product.name}, bỏ qua.`);
        }
        
        // --- Lấy Product Info (Thông tin sản phẩm) ---
        if (!product.product_info) {
             const infoTabSelector = 'li[data-tab="gallery-article"]';
             const infoContentSelector = '.popup-slidearea.popup-vs .content-tab[data-show="gallery-article"]';
            try {
                // Chờ tab "Thông tin sản phẩm" xuất hiện rồi mới click
                const productInfoTab = await productPage.waitForSelector(infoTabSelector, { visible: true, timeout: 10000 });
                await productInfoTab.click();

                // <<< THAY ĐỔI QUAN TRỌNG: Chờ nội dung của tab hiển thị
                await productPage.waitForSelector(infoContentSelector, { visible: true, timeout: 20000 });

                product.product_info = await productPage.evaluate((selector) => {
                    const infoContainer = document.querySelector(selector + ' .info-article-fieldnews .content');
                    return infoContainer?.innerText.trim() || null;
                }, infoContentSelector); // Truyền selector vào evaluate
                console.log(`\t✓ Lấy 'product_info' thành công cho: ${product.name}`);

            } catch (e) {
                if (e.name === 'TimeoutError') {
                    console.warn(`\t[LỖI TIMEOUT] Không thể tải nội dung 'product_info' cho: ${product.name}.`);
                } else {
                    console.warn(`\t[LỖI] Không tìm thấy tab/nội dung 'product_info' cho: ${product.name}.`);
                }
                product.product_info = null; // Gán null để không thử lại
            }
        } else {
            console.log(`\t→ 'product_info' đã tồn tại cho: ${product.name}, bỏ qua.`);
        }

        console.log(`[HOÀN TẤT] Xử lý xong sản phẩm: ${product.name}`);
        return product;

    } catch (err) {
        console.error(`--- [LỖI NGHIÊM TRỌNG] tại ${link}: ${err.message}`);
        // Gán giá trị mặc định để không bị lỗi ở các bước sau
        if (!product.details) product.details = {};
        if (product.product_info === undefined) product.product_info = null;
        return product; // Luôn trả về product để không làm hỏng mảng dữ liệu
    } finally {
        if (productPage) {
            await productPage.close();
        }
    }
};
    
    // 6. Chạy xử lý song song để cập nhật details và product_info cho tất cả sản phẩm
    const concurrencyLimit = 2; // Giới hạn chỉ 2 tác vụ chạy cùng lúc
    
    for (let i = 0; i < productLinks.length; i += concurrencyLimit) {
        const batch = [];
        for (let j = 0; j < concurrencyLimit && i + j < productLinks.length; j++) {
            if (productsData[i + j]) {
                batch.push(processProduct(productsData[i + j], productLinks[i + j]));
            }
        }
        await Promise.all(batch);
    }

    await browser.close();

    // 7. Ghi đè file JSON cũ bằng dữ liệu đã được cập nhật
    fs.writeFileSync('hotrotieuhoa.json', JSON.stringify(productsData, null, 2), 'utf-8');
    console.log('Hoàn tất! Data đã cập nhật và ghi đè vào file hotrotieuhoa.json');
})();