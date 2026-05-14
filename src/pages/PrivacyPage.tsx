export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">隱私權政策</h1>
      
      <div className="prose prose-sm sm:prose-base dark:prose-invert text-gray-700 space-y-6">
        <p className="text-sm text-gray-500 mb-6">最後更新日期：2026年5月</p>
        
        <p>
          Larpup（以下簡稱「本平台」）非常重視您的隱私權。本隱私權政策旨在說明我們如何蒐集、使用、儲存及保護您的個人資料，請您在註冊或使用本服務前，仔細閱讀以下內容。
        </p>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">1. 我們蒐集的資料</h2>
          <p>當您註冊或使用本服務時，我們會蒐集以下資訊：</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>基本帳號資料：</strong>Email、密碼、暱稱、性別。</li>
            <li><strong>第三方登入資料：</strong>若您使用 LINE 或 Google 登入，我們將取得您在該平台授權的公開資訊（如 ID、Email、姓名等）。</li>
            <li><strong>活動紀錄：</strong>您在平台上的報名、建立活動、留言及劇本評分等互動紀錄。</li>
            <li><strong>裝置與連線資訊：</strong>IP 位址、瀏覽器類型、作業系統等（用於安全防護與異常登入偵測）。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">2. 資料的使用目的</h2>
          <p>我們蒐集的資料將用於以下目的：</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>提供、維護及改善本平台的服務。</li>
            <li>身分驗證與帳號安全管理。</li>
            <li>寄送服務相關通知（如活動提醒、密碼重置等）。</li>
            <li>分析使用者行為以優化平台體驗。</li>
            <li>處理客服需求與使用者申訴。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">3. 資料的分享與揭露</h2>
          <p>我們承諾不會將您的個人資料出售或出租給任何第三方。但在以下情況，我們可能會分享或揭露您的資料：</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>經您同意：</strong>在獲得您的明確同意後。</li>
            <li><strong>活動需求：</strong>為方便活動進行，主辦人可看見參加者的暱稱及報名資訊。</li>
            <li><strong>法律要求：</strong>依法令規定、司法機關或相關政府機關之要求。</li>
            <li><strong>維護平台權益：</strong>為調查或防止違法行為、違反服務條款之情事，或保護平台及其他使用者的安全。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">4. Cookie 與追蹤技術</h2>
          <p>本平台使用 Cookie 及類似技術來：</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>保持您的登入狀態。</li>
            <li>記住您的偏好設定。</li>
            <li>分析網站流量與使用情形。</li>
          </ul>
          <p className="mt-2">您可隨時透過瀏覽器設定拒絕或刪除 Cookie，但這可能導致本平台部分功能無法正常使用。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">5. 使用者的權利</h2>
          <p>依據相關法令，您對自己的個人資料享有以下權利：</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>查詢、請求閱覽或請求製給複製本。</li>
            <li>請求補充或更正。</li>
            <li>請求停止蒐集、處理或利用。</li>
            <li>請求刪除帳號及相關個人資料。</li>
          </ul>
          <p className="mt-2">如欲行使上述權利，請透過平台的客服管道聯繫我們。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">6. 隱私權政策的修訂</h2>
          <p>
            本平台保留隨時修改本隱私權政策的權利。重大變更時，我們將於平台上公告或透過 Email 通知您。若您在修改後繼續使用本服務，即視為您已閱讀、瞭解並同意接受修改後的內容。
          </p>
        </section>

      </div>
    </div>
  );
}
