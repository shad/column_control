require 'rubygems'
require 'mongrel'

class ItemHandler < Mongrel::HttpHandler
  def process(request, response)
    response.start(200) do |head,out|
      head["Content-Type"] = "text/plain"
      
      ret = "<ul>"
      10.times do
        num = rand(1000)
        ret << "<li pathname='#{num}'>#{num}</li>"
      end
      ret << "</ul>"
      
      out.write ret
    end
  end
end

h = Mongrel::HttpServer.new("0.0.0.0", "3000")
h.register("/items", ItemHandler.new)
h.register("/cc_js", Mongrel::DirHandler.new("../js"))
h.register("/", Mongrel::DirHandler.new("."))
puts 'Column Config Test Server running at http://localhost:3000/'
h.run.join

