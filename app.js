// 等待DOM完全載入後再執行
document.addEventListener('DOMContentLoaded', () => {

    const scanButton = document.getElementById('scanButton');
    const logElement = document.getElementById('log');

    // 統一的日誌記錄函數，方便管理輸出
    function log(message) {
        const now = new Date();
        const timestamp = now.toLocaleTimeString();
        logElement.textContent = `${timestamp}: ${message}\n` + logElement.textContent;
        console.log(message); // 同時在瀏覽器控制台輸出，方便除錯
    }

    // --- 1. 檢查 Web NFC 支援性 ---
    if ('NDEFReader' in window) {
        log('您的瀏覽器支援 Web NFC！');
    } else {
        log('錯誤：您的瀏覽器不支援 Web NFC。請使用 Android 版 Chrome 89 或更高版本。');
        scanButton.disabled = true;
    }

    // --- 2. 為掃描按鈕添加點擊事件監聽器 ---
    scanButton.addEventListener('click', async () => {
        log('使用者點擊了掃描按鈕...');
        log('請注意：瀏覽器可能會彈出權限請求，請點擊「允許」。');

        try {
            // --- 3. 初始化 NDEFReader 並啟動掃描 ---
            // NDEFReader 必須在使用者手勢（如點擊）觸發的事件中被實例化
            const ndef = new NDEFReader();

            // scan() 會返回一個 Promise，並觸發權限請求
            await ndef.scan();
            log('> 掃描已成功啟動！');
            log('> 請將 NFC 標籤靠近您的裝置...');

            // --- 4. 設置事件監聽器來處理讀取到的資料 ---
            ndef.addEventListener('reading', ({ message, serialNumber }) => {
                log(`> 成功讀取到 NFC 標籤！`);
                log(`  - 標籤序號 (SN): ${serialNumber}`);
                //log(`  - NDEF 訊息記錄數量: ${message.records.length}`);

               // for (const record of message.records) {
              //      log(`--- 新紀錄 ---`);
              //      log(`  - 記錄類型 (Type): ${record.recordType}`);
              //      log(`  - MIME 類型 (MIME): ${record.mediaType || 'N/A'}`);
              //      log(`  - 資料 (Data): ${decodeRecord(record)}`);
             //   }
            });

            // 處理讀取錯誤（例如標籤損壞）
            ndef.addEventListener('readingerror', () => {
                log('警告：無法讀取此 NFC 標籤。它可能已損壞或格式不符。');
            });

        } catch (error) {
            // --- 5. 捕捉並處理各種可能的錯誤 ---
            log(`錯誤發生：${error.name} - ${error.message}`);
            if (error.name === 'NotAllowedError') {
                log('解決方案：您拒絕了 NFC 的使用權限。請點擊網址列旁的圖示，進入「權限」設定，手動允許本網站使用 NFC，然後重新整理頁面。');
            } else if (error.name === 'InvalidStateError') {
                log('解決方案：Web NFC 必須在頂層、安全的（HTTPS）環境中執行。請確保您不是在 iframe 或不安全的 http:// 頁面中執行。');
            } else {
                log('發生未預期的錯誤，請檢查瀏覽器控制台以獲取更多資訊。');
            }
        }
    });

    // --- 輔助函數：解碼不同類型的 NDEF 紀錄 ---
    function decodeRecord(record) {
        const textDecoder = new TextDecoder(record.encoding || 'utf-8');

        switch (record.recordType) {
            case "text":
                // 處理純文字記錄
                return `「${textDecoder.decode(record.data)}」`;
            case "url":
                // 處理 URL 記錄
                return `連結: ${textDecoder.decode(record.data)}`;
            case "mime":
                // 處理 MIME 類型記錄，例如 'application/json'
                if (record.mediaType === 'application/json') {
                    return `JSON: ${textDecoder.decode(record.data)}`;
                }
                return `MIME 數據 (類型: ${record.mediaType})`;
            default:
                // 處理其他或未知的記錄類型
                return `不支援的紀錄類型: ${record.recordType}`;
        }
    }
});
