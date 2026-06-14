import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import VideoPage from "@/pages/Video";
import Category from "@/pages/Category";
import Tag from "@/pages/Tag";
import Categories from "@/pages/Categories";
import Tags from "@/pages/Tags";
import Admin from "@/pages/Admin";
import WatchLater from "@/pages/WatchLater";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/video/:id" component={VideoPage} />
      <Route path="/category/:slug" component={Category} />
      <Route path="/tag/:slug" component={Tag} />
      <Route path="/categories" component={Categories} />
      <Route path="/tags" component={Tags} />
      <Route path="/admin" component={Admin} />
      <Route path="/watchlater" component={WatchLater} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
