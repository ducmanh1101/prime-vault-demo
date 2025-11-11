import {
  createBrowserRouter,
  Navigate,
  Outlet,
  type RouteObject,
} from "react-router";
import AppLayout from "../layouts/AppLayout";
import Page from "../app/Page";
import PoolDetail from "../app/pool-details/Page";
import AdminPage from "../app/admin/Page";

const ROUTES_CONFIG: RouteObject[] = [
  {
    element: (
      <AppLayout>
        <Outlet />
      </AppLayout>
    ),
    children: [
      {
        path: "/",
        element: <Page />,
      },
      {
        path: "/admin",
        element: <AdminPage />,
      },
      {
        path: "/pool/:poolId",
        element: <PoolDetail />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];

export const routes = createBrowserRouter(ROUTES_CONFIG);
