using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using CefSharp;
using CefSharp.WinForms;
using System.Net;
using System.Net.Sockets;
using System.Net.WebSockets;
using SuperWebSocket;

namespace WpfApp2
{
    /// <summary>
    /// MainWindow.xaml の相互作用ロジック
    /// </summary>
    public partial class MainWindow : Window
    {
        ChromiumWebBrowser browser = new ChromiumWebBrowser();
        private WebSocketServer wsServer;
        private List<WebSocketSession> wsClients;

        public MainWindow()
        {
            

            InitializeComponent();
            CefSettings settings = new CefSettings();
            settings.RegisterScheme(new CefSharp.CefCustomScheme()
            {
                SchemeName = "local",
                SchemeHandlerFactory = new LocalSchemeHandlerFactory(@"Z:\Drive\GitHub")
            });
            Cef.Initialize(settings);
            browser = new ChromiumWebBrowser();
            this.wfh.Child = browser;

            //this.browser.Load(@"file:Z:\Drive\GitHub\3D_WebGL\index.html");
            this.browser.Load("local://3D_WebGL");

            int port = 8080;
            wsServer = new WebSocketServer();
            wsClients = new List<WebSocketSession>();
            wsServer.Setup(port);
            wsServer.NewSessionConnected += WsServer_NewSessionConnected;
            wsServer.SessionClosed += WsServer_SessionClosed;
            wsServer.Start();

        }

        private void WsServer_SessionClosed(WebSocketSession session, SuperSocket.SocketBase.CloseReason value)
        {
            wsClients.Remove(session);
            Console.WriteLine("Client disconnected");
        }

        private void WsServer_NewSessionConnected(WebSocketSession session)
        {
            wsClients.Add(session);
            Console.WriteLine("Client Connected");
            session.Send("Hello client!");

        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            
            int vres = Convert.ToInt32(this.tb_vres.Text);
            int hres = Convert.ToInt32(this.tb_hres.Text);
            double r = 150;


            double[,,] vertexs = new double[vres, hres, 3];
            for (int i = 0; i < vres; i++)
            {
                for (int j = 0; j < hres; j++)
                {
                    double theta_z = Math.PI / 2 - Math.PI / (vres - 1) * i;
                    double theta_h = 2 * Math.PI / (hres - 1) * j;
                    double r_h = r * Math.Cos(theta_z);
                    vertexs[i, j, 0] = r_h * Math.Cos(theta_h);
                    vertexs[i, j, 1] = r_h * Math.Sin(theta_h);
                    vertexs[i, j, 2] = r * Math.Sin(theta_z);
                }
            }

            string jsonData = Newtonsoft.Json.JsonConvert.SerializeObject(vertexs, Newtonsoft.Json.Formatting.None);

            foreach (var item in wsClients)
            {
                item.Send(jsonData);
            }
            
        }
    }
}
