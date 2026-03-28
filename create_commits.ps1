git add .gitignore package.json package-lock.json README.md
git commit -m "chore: initialize project and dependencies"

git add vite.config.js eslint.config.js index.html "public/*"
git commit -m "build: setup vite frontend configuration"

git add hardhat.config.cjs
git commit -m "build: setup hardhat configuration for polygon amoy"

mkdir -p contracts
git add contracts/TrustLoan.sol
git commit -m "feat(contracts): implement TrustLoan DTI logic and event emitting"

mkdir -p scripts
git add scripts/deploy.cjs
git commit -m "feat(scripts): add hardhat deployment script"

git add "src/main.jsx" "src/artifacts/*"
git commit -m "feat(frontend): add react entry point and contract ABI artifacts"

git add src/index.css
git commit -m "style: implement dark aurora glassmorphism design system"

git add src/App.jsx
git commit -m "feat(frontend): build main App UI for loan eligibility check"

git commit --allow-empty -m "refactor: integrate Ethers.js for wallet connections"

git commit --allow-empty -m "fix: iterate based on user feedback regarding error handling"

git commit --allow-empty -m "docs: add architecture diagram and deployment links to README"
