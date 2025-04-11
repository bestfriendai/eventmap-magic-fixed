import React from 'react';
import ApiTester from '../components/ApiTester';
import Header from '../components/Header';

const ApiTestPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="pt-24 pb-12 px-4">
        <ApiTester />
      </div>
    </div>
  );
};

export default ApiTestPage;
