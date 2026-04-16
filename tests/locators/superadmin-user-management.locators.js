/**
 * Superadmin / AP admin — User Management screen locators
 * ------------------------------------------------------------
 * Derived from procalyx-ui reference only (no UI changes here):
 * - Route: `DashboardPage.tsx` → `/dashboard/user-management` → `SuperAdminUserManagementPage.tsx`
 * - Copy strings: `superadmin/constants/user-management.constants.ts` → `SUPERADMIN_USER_MANAGEMENT_TEXT`
 *
 * DOM notes (important for stability):
 * - Create/Edit user panel is a **custom** `<div className={styles.modal}>` — **not** MUI `Dialog`,
 *   so **`getByRole('dialog')` is unreliable** unless the app adds ARIA later.
 * - `<label>` + `<input>` are **siblings** (label does **not** wrap input and has no `htmlFor`),
 *   so **`getByLabel()` may not resolve** the way it does for MUI `TextField`. Prefer:
 *   **placeholders** (exact strings from constants) or **form group** = label text + `input`/`select`.
 * - Relationship / Role / Department / Geography use **native `<select>`** (often exposed as
 *   **combobox** in Chromium). Prefer scoping under the open create-user **`<form>`**.
 * - `ReusableTable` renders MUI `Table`; column headers use constant strings (Name, Email, …).
 *
 * Import in specs: `const L = superadminUserManagementLocators(page); await L.addUserButton.click();`
 */

/** Mirrors `SUPERADMIN_USER_MANAGEMENT_TEXT` (keep in sync if copy changes). */
const UM_TEXT = {
  pageTitle: "User Management",
  pageSubtitle:
    "Manage users and approve pending requests requiring dual authentication",
  approvalQueueTitle: "AP Admin Approval Queue",
  addUser: "Add User",
  downloadTemplate: "Download Template",
  bulkUpload: "Bulk Upload",
  createUserTitle: "Create New User",
  editUserTitle: "Edit User",
  basicInformation: "Basic Information",
  organizationDetails: "Organization Details",
  geographySection: "Geography",
  entityAssignments: "Entity Assignments",
  hospitalNameLabel: "Hospital Name",
  fullName: "Full Name",
  enterFullName: "Enter full name",
  designation: "Designation",
  designationPlaceholder: "e.g., Manager",
  emailAddress: "Email Address",
  emailPlaceholder: "email@example.com",
  contactNumber: "Contact Number",
  phonePlaceholder: "10-digit mobile number",
  relationship: "Relationship",
  selectRelationship: "Select Relationship",
  role: "Role",
  selectRole: "Select Role",
  department: "Department",
  selectDepartment: "Select Department",
  cancel: "Cancel",
  createUserButton: "Create User",
  updateUserButton: "Update User",
  creating: "Creating...",
  updating: "Updating...",
  userCreatedSuccess: "User created successfully",
  userUpdatedSuccess: "User updated successfully",
  nameColumn: "Name",
  emailColumn: "Email",
  phoneColumn: "Contact",
  roleColumn: "Role",
  relationshipColumn: "Relationship",
  departmentColumn: "Department",
  designationColumn: "Designation",
};

/**
 * @param {import('@playwright/test').Page} page
 */
function superadminUserManagementLocators(page) {
  /** Open create-user form: uniquely contains the full-name placeholder. */
  const createUserForm = () =>
    page.locator("form").filter({ has: page.getByPlaceholder(new RegExp(UM_TEXT.enterFullName, "i")) });

  /** Modal overlay: heading is sibling of `<form>`, both inside modal content. */
  const createUserPanel = () =>
    page.locator("div").filter({ has: page.getByRole("heading", { name: new RegExp(`^${UM_TEXT.createUserTitle}$`, "i") }) });

  /**
   * Find `<select>` immediately after a `<label>` in the same form group (see TSX: label + select siblings).
   * Avoids `div.filter({ has: getByText })` — that pattern often resolves to **zero** nodes when nested
   * divs / text nodes differ, which caused TC04 to fail on Relationship/Role despite fields being in the DOM.
   * @param {import('@playwright/test').Locator} scope
   * @param {RegExp} labelHasText
   */
  const selectAfterLabel = (scope, labelHasText) =>
    scope.locator("label").filter({ hasText: labelHasText }).locator("+ select");

  /**
   * Find text input in the same group as label (Full Name, Email, …).
   * @param {import('@playwright/test').Locator} scope
   * @param {RegExp} labelText
   */
  const inputBySectionLabel = (scope, labelText) =>
    scope.locator("div").filter({ has: scope.getByText(labelText) }).locator("input").first();

  return {
    TEXT: UM_TEXT,

    // ——— Route ———
    /** Expect: `/dashboard/user-management` */
    path: "/dashboard/user-management",

    // ——— Page chrome (Layout + page content) ———
    /** Page header: `<h1>` in `SuperAdminUserManagementPage`. */
    headingUserManagement: page.getByRole("heading", { level: 1, name: new RegExp(`^${UM_TEXT.pageTitle}$`, "i") }),

    /** AP Admin approval queue section. */
    headingApprovalQueue: page.getByRole("heading", { name: UM_TEXT.approvalQueueTitle }),

    // ——— User list toolbar ———
    /** MUI contained button, visible text `Add User`, plus Lucide `Plus` icon. */
    addUserButton: page.getByRole("button", { name: new RegExp(`^\\+?\\s*${UM_TEXT.addUser}$`, "i") }),

    downloadTemplateButton: page.getByRole("button", { name: new RegExp(UM_TEXT.downloadTemplate, "i") }),
    bulkUploadButton: page.getByRole("button", { name: new RegExp(UM_TEXT.bulkUpload, "i") }),

    // ——— Data table (`ReusableTable`, MUI Table under the hood) ———
    userTable: page.locator("table").first(),
    columnHeader: (name) => page.getByRole("columnheader", { name, exact: false }),

    // ——— Create / Edit user overlay (custom modal, not role=dialog) ———
    createUserPanel,
    createUserHeading: page.getByRole("heading", { name: new RegExp(`^${UM_TEXT.createUserTitle}$`, "i") }),
    editUserHeading: page.getByRole("heading", { name: new RegExp(`^${UM_TEXT.editUserTitle}$`, "i") }),
    closeModalButton: page.getByRole("button", { name: /^close$/i }),

    /** `<form onSubmit={handleSubmit}>` wrapping Basic Information + … + footer buttons. */
    createUserForm,

    /** Section headings inside modal. */
    sectionBasicInformation: page.getByRole("heading", { name: UM_TEXT.basicInformation }),
    sectionOrganizationDetails: page.getByRole("heading", { name: UM_TEXT.organizationDetails }),
    sectionGeography: page.getByRole("heading", { name: UM_TEXT.geographySection }),
    sectionEntityAssignments: page.getByRole("heading", { name: UM_TEXT.entityAssignments }),

    // ——— Basic Information (prefer placeholders — labels are not `htmlFor`-linked) ———
    fullNameInput: createUserForm().getByPlaceholder(new RegExp(`^${UM_TEXT.enterFullName}$`, "i")),
    designationInput: createUserForm().getByPlaceholder(new RegExp(UM_TEXT.designationPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")),
    emailInput: createUserForm().getByPlaceholder(new RegExp(`^${UM_TEXT.emailPlaceholder.replace(".", "\\.")}$`, "i")),
    contactNumberInput: createUserForm().getByPlaceholder(/^10-digit mobile number$/i),

    /** Fallbacks if placeholder copy changes: input following label text. */
    fullNameInputByLabel: () => inputBySectionLabel(createUserForm(), /Full Name/),
    emailInputByLabel: () => inputBySectionLabel(createUserForm(), /Email Address/),
    contactInputByLabel: () => inputBySectionLabel(createUserForm(), /Contact Number/),

    // ——— Organization Details — native `<select>` ———
    relationshipSelect: () => selectAfterLabel(createUserForm(), /^Relationship/),
    roleSelect: () => selectAfterLabel(createUserForm(), /^Role/),
    departmentSelect: () => selectAfterLabel(createUserForm(), /^Department/),

    // ——— Geography ———
    countrySelect: () => selectAfterLabel(createUserForm(), /^Country/),
    stateSelect: () => selectAfterLabel(createUserForm(), /^State/),
    citySelect: () => selectAfterLabel(createUserForm(), /^City/),

    // ——— Footer ———
    cancelButton: createUserForm().getByRole("button", { name: new RegExp(`^${UM_TEXT.cancel}$`, "i") }),
    /** Primary submit: `Create User` or `Update User`, or loading `Creating...` / `Updating...`. */
    submitCreateOrUpdateButton: createUserForm().getByRole("button", {
      name: new RegExp(`${UM_TEXT.createUserButton}|${UM_TEXT.updateUserButton}|${UM_TEXT.creating}|${UM_TEXT.updating}`, "i"),
    }),

    // ——— Approval queue cards (when queue non-empty) ———
    /** Card actions (see TSX): “Accept”, “Reject”, “Skip” — not the same strings as `approve`/`reject` in constants. */
    acceptApprovalButton: page.getByRole("button", { name: /^accept$/i }),
    rejectApprovalButton: page.getByRole("button", { name: /^reject$/i }),
    skipApprovalButton: page.getByRole("button", { name: /^skip$/i }),

    /** Entity Assignments — `Hospital Name` `<select>` when relationship is hospital (conditional). */
    hospitalNameSelect: () => selectAfterLabel(createUserForm(), /^Hospital Name/),

    /**
     * `Hospital Unit Name` uses `MultiSelectDropdown` (not a native `<select>`): container → `selectBox` → opens list with checkboxes.
     * @see `MultiSelectDropdown.tsx`
     */
    hospitalUnitMultiSelectRoot: () =>
      createUserForm()
        .locator("label")
        .filter({ hasText: /^Hospital Unit Name$/i })
        .locator("xpath=following-sibling::div[1]"),

    /** Manufacturer relationship — native `<select>` (`mfg_name` options). */
    manufacturerSelect: () => selectAfterLabel(createUserForm(), /^Manufacturer$/),

    /**
     * Manufacturer block: label **Hospital Unit** (not “Hospital Unit Name”) + `MultiSelectDropdown`.
     */
    manufacturerHospitalUnitMultiSelectRoot: () =>
      createUserForm()
        .locator("label")
        .filter({ hasText: /^Hospital Unit$/i })
        .locator("xpath=following-sibling::div[1]"),

    divisionSelect: () => selectAfterLabel(createUserForm(), /^Division/),

    therapyAreaMultiSelectRoot: () =>
      createUserForm()
        .locator("label")
        .filter({ hasText: /^Therapy Area$/i })
        .locator("xpath=following-sibling::div[1]"),

    // ——— Toast ———
    successAlert: page.locator('[role="alert"]').filter({ hasText: /success|created|updated/i }),
  };
}

module.exports = {
  UM_TEXT,
  superadminUserManagementLocators,
};
