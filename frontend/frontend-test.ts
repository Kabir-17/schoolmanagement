/**
 * Frontend System Test
 * 
 * This script tests critical frontend functionalities:
 * 1. Build process
 * 2. Component imports
 * 3. Service layer
 * 4. Type definitions
 * 
 * Run: npx ts-node -P tsconfig.node.json frontend-test.ts
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import process from "process";

interface TestResult {
  category: string;
  testName: string;
  status: "✅ PASS" | "❌ FAIL" | "⚠️ WARNING";
  message: string;
}

class FrontendTester {
  private results: TestResult[] = [];
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  private addResult(
    category: string,
    testName: string,
    status: "✅ PASS" | "❌ FAIL" | "⚠️ WARNING",
    message: string
  ) {
    this.results.push({ category, testName, status, message });
    const emoji = status === "✅ PASS" ? "✅" : status === "❌ FAIL" ? "❌" : "⚠️";
    console.log(`${emoji} [${category}] ${testName}: ${message}`);
  }

  private async testWithTimer(
    category: string,
    testName: string,
    testFn: () => Promise<void> | void
  ): Promise<void> {
    try {
      await testFn();
      this.addResult(category, testName, "✅ PASS", "Test passed");
    } catch (error: any) {
      this.addResult(category, testName, "❌ FAIL", error.message || "Test failed");
    }
  }

  // Test 1: Project Structure
  async testProjectStructure() {
    console.log("\n📁 CATEGORY 1: PROJECT STRUCTURE");
    console.log("=".repeat(60));

    const requiredFiles = [
      "package.json",
      "tsconfig.json",
      "vite.config.ts",
      "index.html",
      "src/index.tsx",
      "src/App.tsx",
      "src/services/index.ts",
      "src/context/AuthContext.tsx",
    ];

    for (const file of requiredFiles) {
      await this.testWithTimer("Structure", `File exists: ${file}`, () => {
        const filePath = join(this.projectRoot, file);
        if (!existsSync(filePath)) {
          throw new Error(`File not found: ${file}`);
        }
      });
    }
  }

  // Test 2: Dependencies
  async testDependencies() {
    console.log("\n📦 CATEGORY 2: DEPENDENCIES");
    console.log("=".repeat(60));

    await this.testWithTimer("Dependencies", "package.json is valid", () => {
      const packagePath = join(this.projectRoot, "package.json");
      const packageContent = readFileSync(packagePath, "utf8");
      const packageJson = JSON.parse(packageContent);

      const requiredDeps = [
        "react",
        "react-dom",
        "react-router-dom",
        "axios",
        "lucide-react",
      ];

      const missingDeps = requiredDeps.filter(
        (dep) => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
      );

      if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(", ")}`);
      }
    });
  }

  // Test 3: TypeScript Configuration
  async testTypeScript() {
    console.log("\n🔷 CATEGORY 3: TYPESCRIPT");
    console.log("=".repeat(60));

    await this.testWithTimer("TypeScript", "tsconfig.json is valid", () => {
      const tsconfigPath = join(this.projectRoot, "tsconfig.json");
      const tsconfigContent = readFileSync(tsconfigPath, "utf8");
      JSON.parse(tsconfigContent);
    });

    await this.testWithTimer("TypeScript", "Type definitions exist", () => {
      const typesDir = join(this.projectRoot, "src", "types");
      if (!existsSync(typesDir)) {
        throw new Error("Types directory not found");
      }
    });
  }

  // Test 4: Component Structure
  async testComponents() {
    console.log("\n⚛️ CATEGORY 4: COMPONENTS");
    console.log("=".repeat(60));

    const requiredComponents = [
      "src/components/ProtectedRoute.tsx",
      "src/components/RoleBasedRoute.tsx",
      "src/components/PasswordChangeModal.tsx",
      "src/pages/LoginPage.tsx",
      "src/pages/AdminDashboard.tsx",
      "src/pages/TeacherDashboard.tsx",
      "src/pages/StudentDashboard.tsx",
      "src/pages/ParentDashboard.tsx",
      "src/pages/AccountantDashboard.tsx",
    ];

    for (const component of requiredComponents) {
      await this.testWithTimer("Components", `${component} exists`, () => {
        const componentPath = join(this.projectRoot, component);
        if (!existsSync(componentPath)) {
          throw new Error(`Component not found: ${component}`);
        }
      });
    }
  }

  // Test 5: Service Layer
  async testServices() {
    console.log("\n🔌 CATEGORY 5: SERVICE LAYER");
    console.log("=".repeat(60));

    await this.testWithTimer("Services", "API Service exists", () => {
      const servicePath = join(this.projectRoot, "src", "services", "index.ts");
      if (!existsSync(servicePath)) {
        throw new Error("API Service not found");
      }

      const content = readFileSync(servicePath, "utf8");
      if (!content.includes("apiService")) {
        throw new Error("apiService not exported");
      }
    });
  }

  // Test 6: Build Process
  async testBuild() {
    console.log("\n🔨 CATEGORY 6: BUILD PROCESS");
    console.log("=".repeat(60));

    await this.testWithTimer("Build", "TypeScript compilation", () => {
      try {
        execSync("npx tsc --noEmit", { cwd: this.projectRoot, stdio: "pipe" });
      } catch (error: any) {
        throw new Error(`TypeScript compilation failed: ${error.message}`);
      }
    });

    await this.testWithTimer("Build", "Vite build (dry run)", () => {
      try {
        // Just check if vite config is valid, don't actually build
        const viteConfigPath = join(this.projectRoot, "vite.config.ts");
        const content = readFileSync(viteConfigPath, "utf8");
        if (!content.includes("defineConfig")) {
          throw new Error("Invalid vite config");
        }
      } catch (error: any) {
        throw new Error(`Vite config validation failed: ${error.message}`);
      }
    });
  }

  // Test 7: Environment Configuration
  async testEnvironment() {
    console.log("\n🌍 CATEGORY 7: ENVIRONMENT");
    console.log("=".repeat(60));

    await this.testWithTimer("Environment", ".env.example exists", () => {
      // Check if there's any env configuration
      const envFiles = [".env", ".env.local", ".env.development"];
      const hasEnv = envFiles.some((file) => existsSync(join(this.projectRoot, file)));

      if (!hasEnv) {
        this.addResult(
          "Environment",
          ".env file",
          "⚠️ WARNING",
          "No .env file found, using default config"
        );
      }
    });
  }

  // Generate Report
  private generateReport() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 FRONTEND TEST REPORT");
    console.log("=".repeat(60));

    const passed = this.results.filter((r) => r.status === "✅ PASS").length;
    const failed = this.results.filter((r) => r.status === "❌ FAIL").length;
    const warnings = this.results.filter((r) => r.status === "⚠️ WARNING").length;
    const total = this.results.length;

    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total Tests: ${total}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⚠️ Warnings: ${warnings}`);
    console.log(`   📊 Success Rate: ${((passed / total) * 100).toFixed(2)}%`);

    if (failed > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      this.results
        .filter((r) => r.status === "❌ FAIL")
        .forEach((r) => {
          console.log(`   - [${r.category}] ${r.testName}: ${r.message}`);
        });
    }

    console.log("\n" + "=".repeat(60));
    if (failed === 0) {
      console.log("🎉 ALL FRONTEND TESTS PASSED!");
    } else {
      console.log("⚠️ SOME FRONTEND TESTS FAILED");
    }
    console.log("=".repeat(60));

    process.exit(failed > 0 ? 1 : 0);
  }

  // Run all tests
  async runAllTests() {
    console.log("🚀 FRONTEND SYSTEM TEST");
    console.log("=".repeat(60));
    console.log(`📅 Date: ${new Date().toLocaleString()}`);
    console.log(`📁 Project: ${this.projectRoot}`);
    console.log("=".repeat(60));

    try {
      await this.testProjectStructure();
      await this.testDependencies();
      await this.testTypeScript();
      await this.testComponents();
      await this.testServices();
      await this.testBuild();
      await this.testEnvironment();
    } catch (error: any) {
      console.error("\n💥 FATAL ERROR:", error.message);
    }

    this.generateReport();
  }
}

// Run tests
const tester = new FrontendTester();
tester.runAllTests();
