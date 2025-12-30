import React from "react";
import { render } from "@testing-library/react";

const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => ({ get: () => null }),
}));

const setAccessTokenMock = jest.fn();
jest.mock("@/lib/api", () => ({
  setAccessToken: (token: string) => setAccessTokenMock(token),
}));

import AuthCallbackPage from "@/app/auth/callback/page";

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    setAccessTokenMock.mockClear();

    window.history.replaceState(
      {},
      "",
      "/auth/callback#access_token=test.jwt.token&token_type=bearer"
    );
    window.location.hash = "#access_token=test.jwt.token&token_type=bearer";
  });

  it("stores access token and redirects home", async () => {
    render(<AuthCallbackPage />);

    expect(setAccessTokenMock).toHaveBeenCalledWith("test.jwt.token");
    expect(replaceMock).toHaveBeenCalledWith("/");
  });
});


