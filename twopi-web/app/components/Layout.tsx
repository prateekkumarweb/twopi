import { Link, useRouter } from "@tanstack/react-router";
import { type User } from "better-auth";
import { Menu } from "lucide-react";
import { type ReactNode } from "react";
import { authClient } from "~/lib/auth-client";

export default function Layout(props: { user?: User; children: ReactNode }) {
  const router = useRouter();

  const signOut = async () => {
    await authClient.signOut();
    await router.invalidate();
    await router.navigate({ to: "/" });
  };

  return (
    <>
      <div className="d-navbar bg-base-100 shadow-sm">
        <div className="d-navbar-start">
          <div className="d-dropdown">
            <div
              tabIndex={0}
              role="button"
              className="d-btn d-btn-ghost d-btn-circle"
            >
              <Menu />
            </div>
            <ul
              tabIndex={0}
              className="d-menu d-menu-sm d-dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              <li>
                <Link to="/app">App</Link>
              </li>
              <li>
                <Link to="/app/currency">Currency</Link>
              </li>
              <li>
                <Link to="/app/account">Account</Link>
              </li>
              <li>
                <Link to="/app/transaction">Transaction</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="d-navbar-center">
          <Link to="/" className="d-btn d-btn-ghost text-xl">
            TwoPi
          </Link>
        </div>
        {props.user ? (
          <div className="d-navbar-end">
            <div className="d-dropdown d-dropdown-end">
              <div tabIndex={0} role="button" className="d-btn d-btn-ghost">
                Hi {props.user.name}
              </div>
              <ul
                tabIndex={0}
                className="d-menu d-menu-sm d-dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
              >
                <li>
                  <button className="d-btn d-btn-primary" onClick={signOut}>
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="d-navbar-end flex gap-4">
            <Link to="/signin" className="d-btn d-btn-primary">
              Sign in / Sign up
            </Link>
          </div>
        )}
      </div>
      <div className="m-4">{props.children}</div>
    </>
  );
}
