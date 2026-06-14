import { lazy } from "react";
import React from "react";

const lazyWithRetry = (componentImport: () => Promise<unknown>) =>
  lazy(async () => {
    try {
      const component = await componentImport();
      return component as { default: React.ComponentType };
    } catch {
      return {
        default: () => (
          React.createElement('div', { className: "flex items-center justify-center min-h-screen p-4" },
            React.createElement('div', { className: "text-center max-w-md" },
              React.createElement('div', { className: "text-5xl mb-4" }, "📡"),
              React.createElement('h2', { className: "text-xl font-bold mb-2" }, "Ошибка загрузки"),
              React.createElement('p', { className: "text-muted-foreground mb-6" }, "Не удалось загрузить страницу. Проверьте подключение к интернету."),
              React.createElement('div', { className: "flex flex-col sm:flex-row gap-3 justify-center" },
                React.createElement('button', {
                  onClick: () => window.location.reload(),
                  className: "px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 active:opacity-80"
                }, "Попробовать снова"),
                React.createElement('button', {
                  onClick: () => { window.location.href = '/'; },
                  className: "px-5 py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 active:opacity-80"
                }, "На главную")
              )
            )
          )
        )
      } as { default: React.ComponentType };
    }
  });

export const Login = lazyWithRetry(() => import("./pages/Login"));
export const Offers = lazyWithRetry(() => import("./pages/Offers"));
export const OfferDetail = lazyWithRetry(() => import("./pages/OfferDetail"));
export const Home = lazyWithRetry(() => import("./pages/Home"));
export const Register = lazyWithRetry(() => import("./pages/Register"));
export const MyOrders = lazyWithRetry(() => import("./pages/MyOrders"));
export const Profile = lazyWithRetry(() => import("./pages/Profile"));
export const SearchResults = lazyWithRetry(() => import("./pages/SearchResults"));
export const Requests = lazyWithRetry(() => import("./pages/Requests"));
export const MyListings = lazyWithRetry(() => import("./pages/MyListings"));
export const MyOffers = lazyWithRetry(() => import("./pages/MyOffers"));
export const MyRequests = lazyWithRetry(() => import("./pages/MyRequests"));
export const CreateOffer = lazyWithRetry(() => import("./pages/CreateOffer"));
export const EditOffer = lazyWithRetry(() => import("./pages/EditOffer"));
export const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
export const NewPassword = lazyWithRetry(() => import("./pages/NewPassword"));
export const VerifyEmail = lazyWithRetry(() => import("./pages/VerifyEmail"));
export const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
export const Auctions = lazyWithRetry(() => import("./pages/Auctions"));
export const MyAuctions = lazyWithRetry(() => import("./pages/MyAuctions"));
export const ActiveOrders = lazyWithRetry(() => import("./pages/ActiveOrders"));
export const RequestDetail = lazyWithRetry(() => import("./pages/RequestDetail"));
export const EditRequest = lazyWithRetry(() => import("./pages/EditRequest"));
export const CreateRequest = lazyWithRetry(() => import("./pages/CreateRequest"));
export const CreateAuction = lazyWithRetry(() => import("./pages/CreateAuction"));
export const EditAuction = lazyWithRetry(() => import("./pages/EditAuction"));
export const AuctionDetail = lazyWithRetry(() => import("./pages/AuctionDetail"));
export const VerificationPage = lazyWithRetry(() => import("./pages/VerificationPage"));
export const VerificationResubmit = lazyWithRetry(() => import("./pages/VerificationResubmit"));
export const AdminVerifications = lazyWithRetry(() => import("./pages/AdminVerifications"));
export const AdminLogin = lazyWithRetry(() => import("./pages/AdminLogin"));
export const AdminChangePassword = lazyWithRetry(() => import("./pages/AdminChangePassword"));
export const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
export const AdminUsers = lazyWithRetry(() => import("./pages/AdminUsers"));
export const AdminDeletedUsers = lazyWithRetry(() => import("./pages/AdminDeletedUsers"));
export const AdminOffers = lazyWithRetry(() => import("./pages/AdminOffers"));
export const AdminRequests = lazyWithRetry(() => import("./pages/AdminRequests"));
export const AdminAnalytics = lazyWithRetry(() => import("./pages/AdminAnalytics"));
export const AdminSettings = lazyWithRetry(() => import("./pages/AdminSettings"));
export const AdminAuctions = lazyWithRetry(() => import("./pages/AdminAuctions"));
export const AdminContracts = lazyWithRetry(() => import("./pages/AdminContracts"));
export const AdminReviews = lazyWithRetry(() => import("./pages/AdminReviews"));
export const AdminManageAdmins = lazyWithRetry(() => import("./pages/AdminManageAdmins"));
export const AdminPanel = lazyWithRetry(() => import("./pages/AdminPanel"));
export const AdminOrders = lazyWithRetry(() => import("./pages/AdminOrders"));
export const AdminArbitrage = lazyWithRetry(() => import("./pages/AdminArbitrage"));
export const AdminSupport = lazyWithRetry(() => import("./pages/AdminSupport"));
export const SetAdminPassword = lazyWithRetry(() => import("./pages/SetAdminPassword"));
export const AdminContentManagement = lazyWithRetry(() => import("./pages/AdminContentManagement"));
export const TradingPlatform = lazyWithRetry(() => import("./pages/TradingPlatform"));
export const CreateContract = lazyWithRetry(() => import("./pages/CreateContract"));
export const OrderPage = lazyWithRetry(() => import("./pages/OrderPage"));
export const MyReviews = lazyWithRetry(() => import("./pages/MyReviews"));
export const MosquitoRepellent = lazyWithRetry(() => import("./pages/MosquitoRepellent"));
export const BrainBooster = lazyWithRetry(() => import("./pages/BrainBooster"));
export const TaxReports = lazyWithRetry(() => import("./pages/TaxReports"));
export const SellerReviews = lazyWithRetry(() => import("./pages/SellerReviews"));
export const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
export const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
export const OfferAgreement = lazyWithRetry(() => import("./pages/OfferAgreement"));
export const Support = lazyWithRetry(() => import("./pages/Support"));
export const ClearData = lazyWithRetry(() => import("./pages/ClearData"));
export const DeleteTestData = lazyWithRetry(() => import("./pages/DeleteTestData"));
export const MigrateImages = lazyWithRetry(() => import("./pages/MigrateImages"));
export const VerifyPhone = lazyWithRetry(() => import("./pages/VerifyPhone"));
export const ImageEditor = lazyWithRetry(() => import("./pages/ImageEditor"));
export const ShortUrlRedirect = lazyWithRetry(() => import("./pages/ShortUrlRedirect"));
export const MyAutoSales = lazyWithRetry(() => import("./pages/MyAutoSales"));
export const MyAutoRequests = lazyWithRetry(() => import("./pages/MyAutoRequests"));
export const MyContracts = lazyWithRetry(() => import("./pages/MyContracts"));
export const ContractDetail = lazyWithRetry(() => import("./pages/ContractDetail"));
export const EditContract = lazyWithRetry(() => import("./pages/EditContract"));
