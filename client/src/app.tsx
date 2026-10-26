import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import AssetListPage from './pages/AssetList/AssetListPage';
import AssetDetailPage from './pages/AssetDetail/AssetDetailPage';
import UploadPage from './pages/Upload/UploadPage';
import ReviewPage from './pages/Review/ReviewPage';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<AssetListPage />} />
        <Route path="assets" element={<AssetListPage />} />
        <Route path="asset-detail/:id" element={<AssetDetailPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="review" element={<ReviewPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
