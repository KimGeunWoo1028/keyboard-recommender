import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CollapsibleJson } from "./collapsible-json";

describe("CollapsibleJson", () => {
  it("toggles JSON visibility", async () => {
    const user = userEvent.setup();
    render(<CollapsibleJson label="Payload" data={{ a: 1 }} />);
    expect(screen.queryByText('"a"')).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Payload/i }));
    expect(screen.getByText(/"a"/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Payload/i }));
    expect(screen.queryByText('"a"')).not.toBeInTheDocument();
  });
});
