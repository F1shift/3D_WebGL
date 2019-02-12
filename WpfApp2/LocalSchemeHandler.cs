using System;
using System.IO;
using System.Linq;
using CefSharp;

namespace WpfApp2
{
    class LocalSchemeHandlerFactory : ISchemeHandlerFactory
    {
        public string localpath;
        
        public LocalSchemeHandlerFactory(string localpath)
        {
            this.localpath = localpath;
        }

        public IResourceHandler Create(IBrowser browser, IFrame frame, string schemeName, IRequest request)
        {
            if (schemeName == "local")
            {
                var path = request.Url.Split(':')[1];
                if (path.Last() == '/')
                {
                    path += "index.html";
                }
                path = path.Replace('/', '\\');
                path = path.Remove(0,  1);
                string fullpath = localpath + path;
                string extention = Path.GetExtension(fullpath);
                string mimeType;
                switch (extention)
                {
                    case ".html":
                        mimeType = "text/html";
                        break;
                    case ".js":
                       mimeType = "text/javascript";
                        break;
                    case ".css":
                       mimeType = "text/css";
                        break;
                    case ".jpg":
                        mimeType = "image/jpeg";
                        break;
                    case ".png":
                        mimeType = "image/png";
                        break;
                    case ".appcache":
                    case ".manifest":
                        mimeType = "text/cache-manifest";
                        break;
                    default:
                        mimeType = "application/octet-stream";
                        break;
                }
                return ResourceHandler.FromFilePath(fullpath, mimeType);
            }
            return new ResourceHandler();
        }
    }
}
