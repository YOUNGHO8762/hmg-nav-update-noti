const { chromium } = require('playwright');

// 1. 인자값 체크 및 할당
const [modelName, modelYear] = process.argv.slice(2);

if (!modelName || !modelYear) {
  console.error('❌ 사용법: pnpm start "모델명" "연식"');
  console.error('예: pnpm start "아반떼" "The new AVANTE"');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`🚀 조회를 시작합니다: [${modelName}] / [${modelYear}]`);

    // 현대 업데이트 홈 접속
    await page.goto('https://update.hyundai.com/KR/KO/home');

    // 2. 차종 선택 모달 열기
    await page.getByRole('button', { name: '차종 선택해서 조회하기' }).click();
    console.log('✅ 단계 1: 차종 선택 모달 오픈');

    // 3. 모델명 선택 (정확한 텍스트 매칭을 위해 filter 활용)
    const modelButton = page
      .locator('button')
      .filter({ hasText: new RegExp(`^${modelName}$`) });
    await modelButton.waitFor({ state: 'visible' });
    await modelButton.click();
    console.log(`✅ 단계 2: 모델명(${modelName}) 클릭 완료`);

    // 4. 다음 단계 이동
    await page.getByRole('button', { name: '다음' }).click();

    // 5. 연식 선택
    const yearButton = page
      .locator('button')
      .filter({ hasText: new RegExp(`^${modelYear}$`) });
    await yearButton.waitFor({ state: 'visible' });
    await yearButton.click();
    console.log(`✅ 단계 3: 연식(${modelYear}) 클릭 완료`);

    // 6. 조회 버튼 클릭 (마지막 버튼 선택 로직 유지)
    await page.locator('button:has-text("조회")').last().click();
    console.log('✅ 단계 4: 조회 요청 전송');

    // 7. 결과 페이지 대기 및 데이터 추출
    // 네트워크가 안정될 때까지 혹은 특정 요소가 보일 때까지 대기
    await page.waitForSelector('.firmware', { timeout: 10000 });

    const containerText = await page.innerText('.firmware');

    // 8. 정규표현식으로 날짜 추출
    const dateMatch = containerText.match(/(\d{2}년 \d{1,2}월)/);

    console.log('\n' + '='.repeat(40));
    if (dateMatch) {
      console.log(`🎯 결과: ${modelName} (${modelYear})`);
      console.log(`📅 업데이트 배포월: ${dateMatch[0]}`);
    } else {
      console.warn(
        '⚠️ 배포 날짜를 찾을 수 없습니다. (페이지 구조 변경 가능성)',
      );
      console.log('Raw Data:', containerText.trim());
    }
    console.log('='.repeat(40) + '\n');
  } catch (error) {
    console.error('🚨 실행 중 에러 발생:');
    console.error(error.message);
  } finally {
    await browser.close();
    console.log('👋 브라우저를 종료합니다.');
  }
})();
