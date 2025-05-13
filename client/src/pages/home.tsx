import { useState } from "react";
import CustomerView from "@/components/CustomerView";
import { Helmet } from "react-helmet-async";

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Peter's Creation Catering Services - Exceptional Catering for Special Events</title>
        <meta name="description" content="Professional catering services with delicious cuisine for weddings, corporate events, and private parties. Book your special event online today." />
      </Helmet>
      <CustomerView />
    </>
  );
}
