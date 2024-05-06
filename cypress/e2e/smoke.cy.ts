describe("smoke tests", () => {
  afterEach(() => {
    // cy.cleanupUser();
  });

  it("should allow you to get youtube video info", () => {
    const videoId = "9bZkp7q19f0";
    cy.visitAndCheck("/");
    cy.findByRole("textbox").type(`https://www.youtube.com/watch?v=${videoId}`);
    cy.findByRole("button", { name: /convert/i }).click();

    cy.findByRole("button", { name: /download/i }).should("exist");
  });
});
