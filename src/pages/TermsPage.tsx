export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">服務條款</h1>
      
      <div className="prose prose-sm sm:prose-base dark:prose-invert text-gray-700 space-y-6">
        <p className="text-sm text-gray-500 mb-6">最後更新日期：2026年5月</p>
        
        <p>
          歡迎使用 Larpup（以下簡稱「本平台」）。本服務條款構成您與本平台之間的法律協議。當您註冊或使用本服務時，即表示您已閱讀、瞭解並同意接受本條款之所有內容。
        </p>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">1. 帳號與安全</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>您承諾在註冊時提供真實、準確的資料，禁止冒用他人身分。</li>
            <li>本平台帳號僅供您個人使用，不得轉讓、出借或與他人共用。</li>
            <li>您有責任妥善保管您的帳號與密碼。如發現帳號遭盜用或有任何安全漏洞，請立即通知我們。</li>
            <li>對於因您未妥善保管帳號而導致的任何損失，本平台概不負責。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">2. 使用規範</h2>
          <p>您同意在使用本平台時，絕不進行以下行為：</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>上傳、發布或傳送任何誹謗、侮辱、具威脅性、攻擊性、不雅、猥褻、不實或違法之內容。</li>
            <li>侵害他人營業秘密、商標權、著作權、專利權或其他智慧財產權。</li>
            <li>散播電腦病毒、垃圾郵件或進行任何干擾本平台系統正常運作之行為。</li>
            <li>從事未經本平台事前授權的商業行為或廣告發布。</li>
            <li>利用本平台進行任何違反當地法令之活動。</li>
          </ul>
          <p className="mt-2 text-red-500 font-medium">若有違反上述規範，本平台有權不經通知逕行刪除違規內容、暫停或永久終止您的帳號。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">3. 智慧財產權與授權</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              本平台上的內容（包含但不限於文字、圖片、標誌、程式碼）之智慧財產權，均屬本平台或其授權人所有。未經同意，不得隨意重製、改作或散布。
              <div className="text-sm text-gray-500 mt-1.5 p-2 bg-gray-50 rounded border border-gray-100">
                <strong>※ 權利聲明：</strong>本平台所展示之「劇本封面圖」、「劇本角色圖片」及「劇本介紹文字」等相關素材，其所有權與著作權均歸屬於原劇本發行商或創作者所有。本平台僅基於資訊整合與展示之目的予以合理使用，並不對其主張任何所有權。
              </div>
            </li>
            <li>您在平台上傳、發布的內容（如劇本介紹、心得評論、大頭貼等），您仍保有原著作權，但您同意授予本平台全球性、免權利金、非專屬之使用權，得為營運、宣傳本平台之目的進行重製、公開傳輸與展示。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">4. 活動媒合免責聲明</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Larpup 僅提供桌上 LARP 活動之資訊發布與媒合服務，並不直接參與或介入實體活動。</li>
            <li>活動之實際品質、安全性、費用及退費等事宜，概由活動主辦人負責。使用者參加實體活動時，應自行注意人身及財物安全。</li>
            <li>若因參與活動發生任何糾紛、損害或損失，本平台將不負任何法律或賠償責任。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">5. 服務暫停與變更</h2>
          <p>
            本平台保留隨時修改、暫停或終止本服務（或其任何部分）之權利。在以下情況，本平台可能會暫停服務且不負賠償責任：
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>系統設備進行例行性維護或升級。</li>
            <li>發生不可抗力之天災、網路中斷、第三方服務異常（如主機商當機）。</li>
            <li>為配合法令要求或保護平台安全。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">6. 條款修改</h2>
          <p>
            本平台保留隨時修改本服務條款之權利。條款修改後將公告於平台上，重大變更將透過 Email 通知。如您在條款修改後繼續使用本服務，即視為您同意接受修改後的條款。若您不同意修改內容，請立即停止使用本服務並可申請刪除帳號。
          </p>
        </section>

      </div>
    </div>
  );
}
