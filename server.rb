require 'rubygems'
require 'mongrel'

class ItemHandler < Mongrel::HttpHandler
  def process(request, response)
    response.start(200) do |head,out|
      head["Content-Type"] = "text/plain"
      out.write <<-EOF
      <ul>
        <li pathname='foo'>Foo</li>
        <li pathname='bar'>Bar</li>
      </ul>
      EOF
    end
  end
end

h = Mongrel::HttpServer.new("0.0.0.0", "3000")
h.register("/items", ItemHandler.new)
h.register("/", Mongrel::DirHandler.new("."))
h.run.join