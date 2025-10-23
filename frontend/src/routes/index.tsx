import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';
import BooksPage from '../pages/BooksPage';
import BookDetailPage from '../pages/BookDetailPage';
import PostDetailPage from '../pages/PostDetailPage';
import LibrarianRoute from './LibrarianRoute';
import ManagerRoute from './ManagerRoute';
import UsersPage from '../pages/librarian/UsersPage';
import MyLoansPage from '../pages/MyLoansPage';
import FinesPage from '../pages/librarian/FinesPage';
import SuggestionsPage from '../pages/librarian/SuggestionsPage';
import SuggestBookPage from '../pages/SuggestBookPage';
import CategoriesPage from '../pages/librarian/CategoriesPage'; 
import NotificationsPage from '../pages/NotificationsPage';
import AllLoansPage from '../pages/librarian/AllLoansPage';
import ProfilePage from '../pages/ProfilePage'; 
import MyReservationsPage from '../pages/MyReservationsPage';
import ReservationsPage from '../pages/librarian/ReservationsPage'; 
import MyFinesPage from '../pages/MyFinesPage';
import ManualFinesPage from '../pages/librarian/ManualFinesPage';
import ManagerPage from '../pages/manager/ManagerPage';
import PremiumRoute from './PremiumRoute';
import MyChannelPage from '../pages/MyChannelPage';
import PremiumPage from '../pages/PremiumPage';
// import ChannelViewPage from '../pages/ChannelViewPage';
import MySubscriptionsPage from '../pages/MySubscriptionsPage';
// import ChannelsListPage from '../pages/ChannelsListPage';
import GoogleCallbackPage from '../pages/GoogleCallbackPage';



const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/google-callback', // <-- YANGI YO'L
    element: <GoogleCallbackPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />, // Bu yo'l va uning ichidagilar himoyalangan
    children: [
      // COMMENTED OUT - Channels feature not ready for release
      // {
      //   path: '/channels/:linkName',
      //   element: <ChannelViewPage />
      // },
      {
        path: '/posts/:postId',
        element: <PostDetailPage />
      },
      {
        path: '/',
        element: <DashboardPage />,
      },
      // COMMENTED OUT - Channels feature not ready for release
      // { path: '/channels', element: <ChannelsListPage /> },
      {
        path: '/books',
        element: <BooksPage />,
      },
      {
        path: '/books/:id', // :id - bu dinamik parametr
        element: <BookDetailPage />,
      },
      {
        path: '/categories', // <-- YANGI YO'L
        element: <LibrarianRoute />,
        children: [{ path: '', element: <CategoriesPage /> }],
      },
      {
        path: '/users',
        element: <LibrarianRoute />,
        children: [{ path: '', element: <UsersPage /> }],
      },
      {
        path: '/suggestions',
        element: <LibrarianRoute />,
        children: [{ path: '', element: <SuggestionsPage /> }],
      },
      {
        path: '/all-loans',
        element: <LibrarianRoute />,
        children: [{ path: '', element: <AllLoansPage /> }],
      },
       {
        path: '/fines',
        element: <LibrarianRoute />,
        children: [{ path: '', element: <FinesPage /> }],
      },
      {
        path: '/my-loans',
        element: <MyLoansPage />,
      },
      {
        path: '/notifications',
        element: <NotificationsPage />,
      },
      {
        path: '/suggest-book',
        element: <SuggestBookPage />,
      },
      {
        path: '/all-reservations', // <-- YANGI YO'L
        element: <LibrarianRoute />,
        children: [{ path: '', element: <ReservationsPage /> }],
      },
      {
        path: '/manual-fines',
        element: <LibrarianRoute />,
        children: [{ path: '', element: <ManualFinesPage /> }],
      },
      {
        path: '/my-fines',
        element: <MyFinesPage />,
      },
      {
        path: '/get-premium',
        element: <PremiumPage />,
      },
      // COMMENTED OUT - Channels feature not ready for release
      // {
      //   path: '/my-subscriptions',
      //   element: <MySubscriptionsPage />,
      // },
      {
        path: '/manager-panel',
        // Bu yerga keyinroq ManagerRoute qo'yamiz, hozircha LibrarianRoute ishlatib turamiz
        element: <ManagerRoute />, 
        children: [{ path: '', element: <ManagerPage /> }],
      },
      { path: '/my-reservations', element: <MyReservationsPage /> 

      },
      // COMMENTED OUT - Channels feature not ready for release
      // {
      //   path: '/my-channel',
      //   element: <PremiumRoute />,
      //   children: [{ path: '', element: <MyChannelPage /> }],
      // },
      {
        path: '/profile', // <-- YANGI YO'L
        element: <ProfilePage />,
      },
      // Kelajakda bu yerga boshqa himoyalangan sahifalar qo'shiladi
      // Masalan: { path: '/books', element: <BooksPage /> }
    ],
  },
  {
    path: '*', // Boshqa har qanday manzil uchun
    element: <NotFoundPage />,
  },
]);

const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
