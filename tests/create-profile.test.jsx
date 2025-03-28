import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import CreateProfile from "../src/pages/create-profile"
import toast from "react-hot-toast"
import supabase from "../src/utils/supabase"
import { act } from 'react';

// Mock toast.info method since it doesn't exist in react-hot-toast
toast.info = vi.fn();

// Update the supabase mock to correctly export the mock object as the default export
vi.mock("../src/utils/supabase", () => {
    const supabaseMock = {
        auth: {
            getSession: vi.fn()
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            upload: vi.fn().mockReturnThis()
        })),
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn(),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: "http://test-url" } }))
            }))
        }
    };
    return {
        default: supabaseMock,
    };
});

// Update react-router-dom mock to properly mock useNavigate
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

describe("CreateProfile component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Add spies for toast functions
        vi.spyOn(toast, "error");
        vi.spyOn(toast, "success");
        // No need to spy on info since we've already mocked it above
    });

    it("renders the page title", async () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: "123" } } } });
        supabase.from.mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null })
        });

        await act(async () => {
            render(
                <MemoryRouter>
                    <CreateProfile />
                </MemoryRouter>
            );
        });
        expect(screen.getByText("Create Your Profile")).toBeInTheDocument();
    });

    it("shows error if user is not logged in", async () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

        await act(async () => {
            render(
                <MemoryRouter>
                    <CreateProfile />
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("You must be logged in to create a profile");
        });
        expect(navigateMock).toHaveBeenCalledWith("/auth/sign-in");
    });

    it("submits form with valid data", async () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: "123" } } } });
        supabase.from.mockImplementation((table) => {
            if (table === "user_profiles") {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null }),
                    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                    insert: vi.fn().mockResolvedValue({ data: [{}] }) // Mock successful insert
                };
            }
            return {};
        });

        await act(async () => {
            render(
                <MemoryRouter>
                    <CreateProfile />
                </MemoryRouter>
            );
        });
        await act(async () => {
            fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: "John" } });
            fireEvent.change(screen.getByLabelText(/Nickname/i), { target: { value: "johnny" } });
            fireEvent.click(screen.getByRole("button", { name: /Create Profile/i }));
        });

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Profile created successfully!");
        });
        expect(navigateMock).toHaveBeenCalledWith("/profile");
    });

    it("handles nickname already taken error", async () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: "123" } } } });
        supabase.from.mockImplementation(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: "456" } }), // Nickname already exists
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: "456" } }),
            insert: vi.fn().mockResolvedValue({ data: [{}] })
        }));

        await act(async () => {
            render(
                <MemoryRouter>
                    <CreateProfile />
                </MemoryRouter>
            );
        });
        await act(async () => {
            fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: "John" } });
            fireEvent.change(screen.getByLabelText(/Nickname/i), { target: { value: "johnny" } });
            fireEvent.click(screen.getByRole("button", { name: /Create Profile/i }));
        });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("This nickname is already taken. Please choose another one.");
        });
    });

    it("redirects to profile page if user already has a profile", async () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: "123" } } } });
        
        // When the user already has a profile, this query should return profile data
        supabase.from.mockImplementation((table) => {
            if (table === "user_profiles") {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ 
                        data: { id: "123", first_name: "Existing", nickname: "existing_user" } 
                    })
                };
            }
            return {};
        });

        await act(async () => {
            render(
                <MemoryRouter>
                    <CreateProfile />
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(toast.info).toHaveBeenCalledWith("You already have a profile");
            expect(navigateMock).toHaveBeenCalledWith("/profile");
        });
    });
});