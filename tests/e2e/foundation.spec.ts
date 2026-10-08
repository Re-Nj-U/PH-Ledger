import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const screens = [
  { path: "/b/demo", title: "Dashboard" },
  { path: "/b/demo/trips", title: "Trips" },
  { path: "/b/demo/vehicles/expenses", title: "Vehicle expenses" },
  { path: "/b/demo/partners", title: "Partner funding" },
  { path: "/b/demo/reports", title: "Reports" },
  { path: "/b/demo/settings", title: "Settings" },
];

for (const width of [320, 390, 768, 1440]) {
  for (const screen of screens) {
    test(`${screen.title} renders without overflow at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(screen.path);
      await expect(
        page.getByRole("heading", {
          name: screen.title,
          exact: true,
          level: 1,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("navigation", {
          name: width < 768 ? "Mobile navigation" : "Main navigation",
        }),
      ).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
      expect(errors).toEqual([]);
    });
  }
}

for (const screen of screens) {
  test(`${screen.title} passes automated WCAG AA checks`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(screen.path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}

test("period changes show deficit and the matching report reconciliation", async ({
  page,
}) => {
  await page.goto("/b/demo");
  await expect(page.getByText("$20,930.00", { exact: true })).toBeVisible();
  await page.getByLabel("Report month").selectOption("2026-08");
  await expect(
    page.getByText("Monthly cash deficit", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("-$3,850.00", { exact: true })).toBeVisible();
  await page.goto("/b/demo/reports");
  await page.getByLabel("Report month").selectOption("2026-08");
  await expect(
    page.getByText("-$3,350.00", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("$9,800.00", { exact: true }).first(),
  ).toBeVisible();
});

test("trip search, status filtering, empty state, and detail preview work", async ({
  page,
}) => {
  await page.goto("/b/demo/trips");
  await page
    .getByLabel("Search trips, customers, or trip IDs")
    .fill("Coastal weekend");
  await expect(page.getByRole("status")).toHaveText(
    "1 trip found · Sample data",
  );
  await page
    .getByRole("button", { name: "Coastal weekend", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("684 km traveled"),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByLabel("Search trips, customers, or trip IDs")
    .fill("no such trip");
  await expect(
    page.getByRole("heading", { name: "No matching trips" }),
  ).toBeVisible();
  await page.getByLabel("Search trips, customers, or trip IDs").fill("");
  await page.getByRole("tab", { name: "Booked", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Autumn group tour", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Coastal weekend", exact: true }),
  ).toHaveCount(0);
});

test("quick-add form is accessible and previews without changing balances", async ({
  page,
}) => {
  await page.goto("/b/demo");
  await page.getByRole("button", { name: "Quick add", exact: true }).click();
  await page
    .getByRole("button", { name: /New trip Plan your next journey/ })
    .click();
  await page.getByLabel("Trip name", { exact: true }).fill("Demo journey");
  await page.getByLabel("Customer", { exact: true }).fill("Demo customer");
  await page.getByLabel("Agreed trip amount (USD)").fill("1200.99");
  await page.getByLabel("Start date").fill("2026-10-10");
  await page.getByLabel("End date").fill("2026-10-11");
  await page.getByRole("button", { name: "Preview details" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Preview only — nothing saved",
  );
  await expect(page.getByRole("status")).toContainText("$1,200.99");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByText("$20,930.00", { exact: true })).toBeVisible();
});

test("mobile More navigation, EMI deep link, and renewal tab work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/b/demo");
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "More" })
    .click();
  await page.getByRole("dialog").getByRole("link", { name: "Reports" }).click();
  await expect(page).toHaveURL(/\/reports$/);
  await page.goto("/b/demo/vehicles/expenses?tab=emi");
  await expect(
    page.getByRole("tab", { name: "EMI", exact: true }),
  ).toHaveAttribute("data-state", "active");
  await expect(
    page.getByRole("heading", { name: "Vehicle financing" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Renewals" }).click();
  await expect(
    page.getByRole("heading", { name: "Renewal calendar" }),
  ).toBeVisible();
});

test("sample CSV exports and quarter view reconciles", async ({ page }) => {
  await page.goto("/b/demo/reports");
  await page.getByLabel("Report range").selectOption("quarter");
  await expect(
    page.getByText("$20,930.00", { exact: true }).first(),
  ).toBeVisible();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Sample CSV" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("vanledger-demo-2026-q3.csv");
  const stream = await download.createReadStream();
  if (!stream) throw new Error("Export was not readable");
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const contents = Buffer.concat(chunks).toString("utf8");
  expect(contents).toContain("Synthetic sample data");
  expect(contents).toContain("2093000");
});

test("unknown business IDs do not expose a working demo workspace", async ({
  page,
}) => {
  const response = await page.goto("/b/unknown");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "That route isn’t on the map" }),
  ).toBeVisible();
});
