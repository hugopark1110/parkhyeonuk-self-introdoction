# 박현욱 — Vercel 배포용

## 1. GitHub에 올리기

1. 이 ZIP을 압축 해제합니다.
2. 본인 브라우저에서 https://github.com/new 를 엽니다.
3. Repository name은 parkhyeonuk-portfolio, 공개 범위는 Private으로 선택하고 Create repository를 누릅니다.
4. 새 저장소에서 uploading an existing file을 누릅니다. 이미 README를 만들었다면 Add file → Upload files를 누릅니다.
5. 압축을 푼 폴더 안의 파일·폴더를 모두 드래그해 올립니다. ZIP 자체나 가장 바깥의 폴더가 아니라, app·public·package.json 등이 보이는 내용물을 올립니다.
6. 업로드가 끝나면 Commit changes를 누릅니다. 저장소 첫 화면에 package.json이 보여야 합니다.

## 2. Vercel 연결

1. https://vercel.com/new 에서 본인 계정으로 로그인합니다.
2. Import Git Repository에서 위 GitHub 저장소를 선택합니다. 보이지 않으면 GitHub 연결 설정에서 해당 저장소 접근을 허용합니다.
3. Framework는 Next.js, Root Directory는 저장소 루트(.)로 둡니다.
4. 설치와 빌드 설정은 vercel.json에 준비되어 있습니다. 환경 변수 입력은 필요 없습니다.
5. Deploy를 누르고 Ready가 될 때까지 기다립니다. 생성된 vercel.app 주소가 새 홈페이지 주소입니다.

## 포함된 기능

이름 로딩 화면, 5개 3D 오브제, 단계별 스크롤, 360도 회전, 고정 상세 설명, 배경음·효과음, Selected stories, 자문자답 인터뷰, 10주 과제 아카이브를 포함합니다.

## 기록과 사진 관리

화면과 3D 에셋은 Vercel에서 제공됩니다. 과제·사진 데이터와 작성자 편집은 기존 홈페이지 서버를 사용합니다. 홈페이지의 기록 관리 링크로 기존 편집기를 열 수 있습니다. 기존 홈페이지를 삭제하거나 비공개로 바꾸면 콘텐츠 읽기가 중단될 수 있습니다.

이 파일에는 비밀번호, 토큰, 개인 환경 변수, 설치된 라이브러리, 임시 빌드 파일이 포함되어 있지 않습니다.

## 검증

이 배포용 파일 구성으로 Next.js 프로덕션 빌드와 TypeScript 검사를 통과했습니다. API 테스트는 인증 정보 미전달, 비공개 본문 제거, 파일 경로 검증, 편집 요청 거절을 확인했습니다. 계정 로그인과 최종 Vercel 배포는 아직 완료되지 않았습니다.

## 개발

Node.js22, package.json에 지정된 pnpm을 사용합니다.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

음원 출처와 라이선스는 public/audio/ 안의 안내 파일에 있습니다. 자세한 서버 구성은 DEPLOYMENT.md를 참고하세요.

공식 안내:
- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://vercel.com/docs/git/vercel-for-github
